# Testing Guide: Anthropic-OpenAI Proxy Server

This guide explains how to test and use the proxy server with comprehensive logging.

## Prerequisites

1. **Node.js 18+** installed
2. **Chutes API Token** in `.env` file
3. **Dependencies installed**: `npm install`

## Quick Start

### 1. Start the Proxy Server

**Normal mode** (minimal logging):
```bash
npm run proxy
```

**Debug mode** (verbose logging with all details):
```bash
npm run proxy:debug
```

### 2. Server Output

When you start the server, you'll see a banner like this:

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Anthropic <-> OpenAI Proxy Server                       ║
║                                                               ║
║   Enables Claude Code to work with Chutes GLM models         ║
║   via format conversion                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Configuration:
  Proxy Server:    http://localhost:3333
  Backend API:     https://llm.chutes.ai/v1/chat/completions
  Target Model:    zai-org/GLM-4.5-Air
  Debug Mode:      ENABLED / DISABLED

Endpoints:
  GET  /              Health check
  GET  /v1/models     List available models
  POST /v1/messages   Main proxy endpoint (Anthropic format)

To use with Claude Code:
  export ANTHROPIC_AUTH_TOKEN="dummy"
  export ANTHROPIC_BASE_URL="http://localhost:3333"
  claude

Environment Variables:
  CHUTES_API_TOKEN   ✓ Set
  CHUTES_API_URL     ✓ Set
  CHUTES_MODEL       ✓ Set
  PORT               ✓ Set
  DEBUG              ✓ Enabled/Disabled

Logs:
  📥 Blue    = Incoming requests
  🔄 Magenta = Format conversions
  📤 Cyan    = Outgoing to Chutes
  ✅ Green   = Success
  ❌ Red     = Errors
  🌊 Cyan    = Streaming

✨ Server ready! Waiting for requests...
```

## Understanding the Logs

### Log Levels

The proxy uses color-coded logs for easy identification:

- **📥 BLUE** - Incoming requests from Claude Code
- **🔄 MAGENTA** - Format conversion operations
- **📤 CYAN** - Requests forwarded to Chutes API
- **✅ GREEN** - Successful operations
- **❌ RED** - Errors
- **⚠️ YELLOW** - Warnings
- **🌊 CYAN** - Streaming responses

### Log Examples

#### 1. Incoming Request (Always Shown)
```
================================================================================
[2025-10-17T12:34:56.789Z] [INFO] 📥 Incoming Request: POST /v1/messages
================================================================================
```

#### 2. Format Conversion (Debug Mode Only)
```
[2025-10-17T12:34:56.790Z] [DEBUG] 🔄 Format Conversion → TO-OPENAI
Input:
{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [...],
  "tools": [...]
}
Output:
{
  "model": "zai-org/GLM-4.5-Air",
  "messages": [...],
  "tools": [...]
}
```

#### 3. Chutes API Call
```
[2025-10-17T12:34:56.791Z] [INFO] 📤 Forwarding to Chutes: https://llm.chutes.ai/v1/chat/completions
```

#### 4. Chutes Response
```
[2025-10-17T12:34:57.123Z] [SUCCESS] ✅ Chutes Response: 200
```

#### 5. Final Response
```
[2025-10-17T12:34:57.124Z] [SUCCESS] 📤 Sending Final Response to Claude Code
```

### Debug Mode vs Normal Mode

**Normal Mode** (`npm run proxy`):
- Shows request/response flow
- Indicates success/failure
- Minimal output for clean logs

**Debug Mode** (`npm run proxy:debug`):
- Shows EVERYTHING
- Full request/response bodies
- Detailed conversion steps
- Headers and metadata
- Streaming chunk content

## Testing Scenarios

### Test 1: Health Check

```bash
curl http://localhost:3333
```

**Expected Response:**
```json
{
  "status": "OK",
  "service": "Anthropic <-> OpenAI Proxy for Chutes GLM",
  "backend": "https://llm.chutes.ai/v1/chat/completions",
  "model": "zai-org/GLM-4.5-Air",
  "version": "1.0.0"
}
```

**Logs:**
```
[2025-10-17T...] [INFO] Health check requested
```

### Test 2: Models List

```bash
curl http://localhost:3333/v1/models
```

**Expected Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "object": "model",
      "created": 1697545200,
      "owned_by": "anthropic"
    },
    ...
  ]
}
```

**Logs:**
```
[2025-10-17T...] [INFO] Models list requested
```

### Test 3: Simple Message (No Tools)

Create a test file `test-simple-message.sh`:

```bash
#!/bin/bash

curl -X POST http://localhost:3333/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: dummy" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "Say hello!"
      }
    ]
  }'
```

**Expected Logs (Normal Mode):**
```
================================================================================
[...] [INFO] 📥 Incoming Request: POST /v1/messages
================================================================================
[...] [INFO] 🔄 Converting Anthropic format to OpenAI format
[...] [INFO] 📤 Forwarding to Chutes: https://llm.chutes.ai/v1/chat/completions
[...] [SUCCESS] ✅ Chutes Response: 200
[...] [INFO] 📄 Non-streaming response
[...] [INFO] 🔄 Converting OpenAI format to Anthropic format
[...] [SUCCESS] 📤 Sending Final Response to Claude Code
```

**Expected Logs (Debug Mode):**
All of the above PLUS:
- Full request headers
- Full request body
- Complete conversion details (input/output)
- Full Chutes request payload
- Full Chutes response data
- Complete final response

### Test 4: Message with Tool Calling

Create a test file `test-tool-calling-proxy.sh`:

```bash
#!/bin/bash

curl -X POST http://localhost:3333/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: dummy" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "tools": [
      {
        "name": "get_weather",
        "description": "Get weather for a location",
        "input_schema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    ],
    "messages": [
      {
        "role": "user",
        "content": "What'\''s the weather in Tokyo?"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "call_...",
      "name": "get_weather",
      "input": {
        "location": "Tokyo"
      }
    }
  ],
  "model": "zai-org/GLM-4.5-Air",
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 123,
    "output_tokens": 45
  }
}
```

**Key Log Points:**
1. Tool definitions conversion (Anthropic `input_schema` → OpenAI `parameters`)
2. Tool call response conversion (OpenAI `tool_calls` → Anthropic `tool_use` blocks)
3. Stop reason conversion (`tool_calls` → `tool_use`)

### Test 5: Streaming Response

Create a test file `test-streaming.sh`:

```bash
#!/bin/bash

curl -X POST http://localhost:3333/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: dummy" \
  -N \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "stream": true,
    "messages": [
      {
        "role": "user",
        "content": "Count from 1 to 5 slowly"
      }
    ]
  }'
```

**Expected Logs:**
```
[...] [INFO] 📥 Incoming Request: POST /v1/messages
[...] [INFO] 🔄 Converting Anthropic format to OpenAI format
[...] [INFO] 📤 Forwarding to Chutes
[...] [INFO] 🌊 Streaming response detected
1... 2... 3... 4... 5...  (in green, real-time)
[...] [INFO] 🏁 Stream completed
[...] [SUCCESS] ✅ Stream ended successfully
```

**In Debug Mode:** Each streaming chunk is logged with full details.

### Test 6: Using with Claude Code

1. **Start the proxy** (in one terminal):
```bash
npm run proxy:debug
```

2. **Configure Claude Code** (in another terminal):
```bash
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3333"
```

3. **Run Claude Code**:
```bash
claude
```

4. **Test a simple prompt**:
```
You: Write a hello world function in Python
```

5. **Watch the logs** in the proxy terminal:
   - You'll see the full request from Claude Code
   - Format conversion details
   - Tool calling if Claude Code uses any tools
   - Streaming response in real-time
   - Final response sent back

## Debugging Common Issues

### Issue 1: "CHUTES_API_TOKEN not set"

**Symptom:**
```
⚠️  CHUTES_API_TOKEN not set! Proxy will not work without it.
```

**Solution:**
Add to `.env`:
```
CHUTES_API_TOKEN=your_token_here
```

### Issue 2: Connection Refused

**Symptom:**
```
❌ Proxy error: connect ECONNREFUSED 127.0.0.1:3333
```

**Solution:**
- Make sure the proxy is running: `npm run proxy`
- Check if port 3333 is available
- Try a different port: `PORT=8080 npm run proxy`

### Issue 3: Tool Calling Not Working

**Symptom:**
Claude Code doesn't execute tools, or tools return errors.

**Debug Steps:**
1. Enable debug mode: `npm run proxy:debug`
2. Look for tool conversion logs
3. Check if tools are being converted correctly:
   - Anthropic `input_schema` → OpenAI `parameters`
   - OpenAI `tool_calls` → Anthropic `tool_use`

**What to look for:**
```
🔄 Format Conversion → TO-OPENAI
Input:
  "tools": [{
    "name": "get_weather",
    "input_schema": { ... }  // Anthropic format
  }]
Output:
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "parameters": { ... }  // OpenAI format
    }
  }]
```

### Issue 4: Streaming Broken

**Symptom:**
No streaming output, or partial responses.

**Debug Steps:**
1. Check if Chutes returns streaming: Look for `🌊 Streaming response detected`
2. Enable debug mode to see chunk processing
3. Check for parsing errors in SSE chunks

**Key log:**
```
[ERROR] Failed to parse SSE chunk: <error details>
```

### Issue 5: Wrong Response Format

**Symptom:**
Claude Code shows errors about invalid response format.

**Debug Steps:**
1. Enable debug mode
2. Look at the final response being sent:
```
📤 Sending Final Response to Claude Code
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [...],
  ...
}
```
3. Verify it matches Anthropic Messages API format

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CHUTES_API_TOKEN` | ✅ Yes | - | Your Chutes API token |
| `CHUTES_API_URL` | No | `https://llm.chutes.ai/v1/chat/completions` | Chutes API endpoint |
| `CHUTES_MODEL` | No | `zai-org/GLM-4.5-Air` | Model to use |
| `PORT` | No | `3333` | Proxy server port |
| `DEBUG` | No | `false` | Enable verbose logging |

## Performance Tips

### Normal Use
- Use **normal mode** (`npm run proxy`) for production/daily use
- Logs are minimal and clean
- Lower overhead

### Development/Debugging
- Use **debug mode** (`npm run proxy:debug`) when developing or troubleshooting
- See everything that's happening
- Identify issues quickly

### Log Management

**Save logs to file:**
```bash
npm run proxy:debug 2>&1 | tee proxy-logs.txt
```

**Filter specific log levels:**
```bash
npm run proxy:debug 2>&1 | grep ERROR
npm run proxy:debug 2>&1 | grep SUCCESS
```

## Next Steps

1. ✅ Test health check
2. ✅ Test models endpoint
3. ✅ Test simple message
4. ✅ Test tool calling
5. ✅ Test streaming
6. ✅ Test with Claude Code

If all tests pass, you're ready to use Claude Code with Chutes GLM models for FREE! 🎉

## Troubleshooting Checklist

- [ ] Proxy server is running
- [ ] `CHUTES_API_TOKEN` is set in `.env`
- [ ] Port 3333 is available (or custom port is set)
- [ ] `ANTHROPIC_BASE_URL` is set to proxy URL
- [ ] `ANTHROPIC_AUTH_TOKEN` is set (any value works, e.g., "dummy")
- [ ] Debug mode enabled for troubleshooting
- [ ] Logs show successful connections to Chutes

## Support

If you encounter issues:

1. **Enable debug mode**: `npm run proxy:debug`
2. **Check logs** for errors
3. **Test Chutes API directly**: `npm run test:tools`
4. **Verify format conversion** in debug logs
5. **Check network connectivity** to Chutes API

For more details, see:
- `RESEARCH.md` - Background and implementation details
- `TEST-RESULTS.md` - Chutes API tool calling test results
- `README.md` - Project overview
