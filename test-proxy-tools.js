import fetch from "node-fetch";

const PROXY_URL = "http://localhost:3333/v1/messages";

async function testToolCalling() {
  console.log("🧪 Testing Proxy with Tool Calling\n");

  const anthropicRequest = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    tools: [
      {
        name: "get_weather",
        description: "Get the current weather in a given location",
        input_schema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA"
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "The unit of temperature"
            }
          },
          required: ["location"]
        }
      }
    ],
    messages: [
      {
        role: "user",
        content: "What's the weather like in Tokyo?"
      }
    ]
  };

  console.log("📤 Sending Anthropic-format request with tool definitions...\n");

  try {
    const response = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "dummy"
      },
      body: JSON.stringify(anthropicRequest)
    });

    const data = await response.json();

    console.log("✅ Response received!");
    console.log("\nResponse:", JSON.stringify(data, null, 2));

    // Check if response is in Anthropic format
    if (data.type === "message" && data.role === "assistant") {
      console.log("\n✅ Response is in correct Anthropic format!");

      // Check for tool_use blocks
      const toolUseBlocks = data.content.filter(block => block.type === 'tool_use');
      if (toolUseBlocks.length > 0) {
        console.log(`\n✨ SUCCESS: Found ${toolUseBlocks.length} tool_use block(s)!`);
        console.log("\nTool calls:");
        toolUseBlocks.forEach((block, i) => {
          console.log(`  ${i + 1}. ${block.name}(${JSON.stringify(block.input)})`);
        });

        // Check stop_reason
        if (data.stop_reason === "tool_use") {
          console.log("\n✅ stop_reason correctly set to 'tool_use'");
        } else {
          console.log(`\n⚠️  stop_reason is '${data.stop_reason}', expected 'tool_use'`);
        }
      } else {
        console.log("\n❌ FAIL: No tool_use blocks found in response");
      }
    } else {
      console.log("\n❌ FAIL: Response is not in Anthropic format");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

testToolCalling();
