/**
 * Format Converter: Anthropic <-> OpenAI
 * Handles bidirectional conversion between Anthropic Messages API and OpenAI Chat Completions API
 */

/**
 * Convert Anthropic request to OpenAI format
 * @param {Object} anthropicRequest - Anthropic Messages API request
 * @returns {Object} OpenAI Chat Completions API request
 */
export function anthropicToOpenAI(anthropicRequest) {
  const {
    model,
    messages,
    max_tokens,
    temperature,
    top_p,
    top_k,
    stop_sequences,
    stream,
    system,
    tools,
    tool_choice,
    metadata
  } = anthropicRequest;

  // Convert messages
  const openAIMessages = [];

  // Add system message if present
  if (system) {
    // System can be a string or array of content blocks
    const systemContent = typeof system === 'string'
      ? system
      : system.map(block => block.text || '').join('\n');

    openAIMessages.push({
      role: 'system',
      content: systemContent
    });
  }

  // Convert messages
  for (const msg of messages) {
    const openAIMessage = convertAnthropicMessage(msg);
    if (openAIMessage) {
      openAIMessages.push(openAIMessage);
    }
  }

  // Build OpenAI request
  const openAIRequest = {
    model: model || 'gpt-4',
    messages: openAIMessages,
    stream: stream || false
  };

  // Optional parameters
  if (max_tokens) openAIRequest.max_tokens = max_tokens;
  if (temperature !== undefined) openAIRequest.temperature = temperature;
  if (top_p !== undefined) openAIRequest.top_p = top_p;
  if (stop_sequences) openAIRequest.stop = stop_sequences;

  // Convert tools
  if (tools && tools.length > 0) {
    openAIRequest.tools = tools.map(convertAnthropicTool);
  }

  // Convert tool_choice
  if (tool_choice) {
    openAIRequest.tool_choice = convertAnthropicToolChoice(tool_choice);
  }

  return openAIRequest;
}

/**
 * Convert Anthropic message to OpenAI message
 */
function convertAnthropicMessage(anthropicMsg) {
  const { role, content } = anthropicMsg;

  // Handle string content
  if (typeof content === 'string') {
    return { role, content };
  }

  // Handle array of content blocks
  if (Array.isArray(content)) {
    // Check if there are tool_use blocks
    const toolUseBlocks = content.filter(block => block.type === 'tool_use');
    const toolResultBlocks = content.filter(block => block.type === 'tool_result');
    const textBlocks = content.filter(block => block.type === 'text');
    const imageBlocks = content.filter(block => block.type === 'image');

    // If it's a tool result message (user role with tool_result)
    if (role === 'user' && toolResultBlocks.length > 0) {
      return {
        role: 'tool',
        tool_call_id: toolResultBlocks[0].tool_use_id,
        content: typeof toolResultBlocks[0].content === 'string'
          ? toolResultBlocks[0].content
          : JSON.stringify(toolResultBlocks[0].content)
      };
    }

    // If it's an assistant message with tool_use
    if (role === 'assistant' && toolUseBlocks.length > 0) {
      const message = {
        role: 'assistant',
        content: textBlocks.map(b => b.text).join('') || null
      };

      message.tool_calls = toolUseBlocks.map((block, index) => ({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input)
        }
      }));

      return message;
    }

    // Regular text/image message
    if (imageBlocks.length > 0) {
      // OpenAI format for images
      return {
        role,
        content: [
          ...textBlocks.map(b => ({ type: 'text', text: b.text })),
          ...imageBlocks.map(b => ({
            type: 'image_url',
            image_url: {
              url: b.source.type === 'base64'
                ? `data:${b.source.media_type};base64,${b.source.data}`
                : b.source.url
            }
          }))
        ]
      };
    }

    // Just text blocks
    return {
      role,
      content: textBlocks.map(b => b.text).join('')
    };
  }

  return { role, content };
}

/**
 * Convert Anthropic tool to OpenAI tool
 */
function convertAnthropicTool(anthropicTool) {
  return {
    type: 'function',
    function: {
      name: anthropicTool.name,
      description: anthropicTool.description,
      parameters: anthropicTool.input_schema
    }
  };
}

/**
 * Convert Anthropic tool_choice to OpenAI tool_choice
 */
function convertAnthropicToolChoice(anthropicToolChoice) {
  if (typeof anthropicToolChoice === 'string') {
    // "auto", "any", "none"
    if (anthropicToolChoice === 'any') return 'required';
    if (anthropicToolChoice === 'none') return 'none';
    return 'auto';
  }

  if (anthropicToolChoice.type === 'tool') {
    return {
      type: 'function',
      function: { name: anthropicToolChoice.name }
    };
  }

  return 'auto';
}

/**
 * Convert OpenAI response to Anthropic format
 * @param {Object} openAIResponse - OpenAI Chat Completions API response
 * @returns {Object} Anthropic Messages API response
 */
export function openAIToAnthropic(openAIResponse) {
  const { id, model, created, choices, usage } = openAIResponse;

  const choice = choices[0];
  const message = choice.message;

  // Build content blocks
  const content = [];

  // Add text content
  if (message.content) {
    content.push({
      type: 'text',
      text: message.content
    });
  }

  // Add reasoning_content if present (GLM-specific field)
  if (message.reasoning_content && !message.content) {
    content.push({
      type: 'text',
      text: message.reasoning_content
    });
  }

  // Add tool_use blocks
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const toolCall of message.tool_calls) {
      content.push({
        type: 'tool_use',
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments)
      });
    }
  }

  // Determine stop_reason
  let stop_reason = 'end_turn';
  if (choice.finish_reason === 'tool_calls') {
    stop_reason = 'tool_use';
  } else if (choice.finish_reason === 'length') {
    stop_reason = 'max_tokens';
  } else if (choice.finish_reason === 'stop') {
    stop_reason = 'end_turn';
  }

  return {
    id: id || `msg_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content,
    model: model,
    stop_reason: stop_reason,
    stop_sequence: null,
    usage: {
      input_tokens: usage?.prompt_tokens || 0,
      output_tokens: usage?.completion_tokens || 0
    }
  };
}

/**
 * Convert OpenAI streaming chunk to Anthropic streaming format
 */
export function openAIStreamToAnthropic(openAIChunk) {
  const { id, model, choices } = openAIChunk;

  if (!choices || choices.length === 0) {
    return null;
  }

  const delta = choices[0].delta;
  const finish_reason = choices[0].finish_reason;

  // Start event
  if (!delta.content && !delta.tool_calls) {
    return {
      type: 'message_start',
      message: {
        id: id || `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: [],
        model: model,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 }
      }
    };
  }

  // Content delta
  if (delta.content) {
    return {
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text: delta.content
      }
    };
  }

  // Tool call delta
  if (delta.tool_calls) {
    const toolCall = delta.tool_calls[0];
    return {
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'tool_use_delta',
        id: toolCall.id,
        name: toolCall.function?.name,
        input: toolCall.function?.arguments
      }
    };
  }

  // Finish event
  if (finish_reason) {
    let stop_reason = 'end_turn';
    if (finish_reason === 'tool_calls') stop_reason = 'tool_use';
    else if (finish_reason === 'length') stop_reason = 'max_tokens';

    return {
      type: 'message_delta',
      delta: { stop_reason, stop_sequence: null },
      usage: { output_tokens: 1 }
    };
  }

  return null;
}
