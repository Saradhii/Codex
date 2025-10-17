# Codex Proxy - Claude Code to Chutes GLM

A format conversion proxy server that enables using **Chutes GLM models with Claude Code CLI** including **full tool calling support**.

## What It Does

This proxy acts as a bridge between Claude Code and the Chutes GLM-4.5-Air model with format conversion:
- ✅ Receives requests from Claude Code in **Anthropic's Messages API format**
- ✅ Converts to **OpenAI Chat Completions format**
- ✅ Forwards to **Chutes API**
- ✅ Converts responses back to **Anthropic format**
- ✅ **Full tool calling support** (Anthropic `tool_use` ↔ OpenAI `tool_calls`)
- ✅ Handles both **streaming** and **non-streaming** responses
- ✅ **Comprehensive logging** for debugging

**Result**: Use Claude Code with FREE Chutes GLM models with full functionality!

---

## Quick Start (NPM Installation)

**3 simple steps to get started:**

### 1. Install globally via npm
```bash
npm install -g codex-proxy
```

### 2. Start the proxy
```bash
codex-proxy              # Normal mode
codex-proxy --debug      # Debug mode (verbose logging)
codex-proxy --port 4000  # Custom port
codex-proxy --help       # Show all options
```

### 3. Configure Claude Code
In a **new terminal**:
```bash
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3333"
claude
```

**That's it!** Start using Claude Code with free Chutes GLM models.

---

## Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Chutes API credentials
   ```

3. **Start the proxy server**

   **Normal mode** (minimal logging):
   ```bash
   npm run proxy
   ```

   **Debug mode** (verbose logging):
   ```bash
   npm run proxy:debug
   ```

## Configure Claude Code

To use the proxy with Claude Code CLI:

### Option 1: Using environment variables (Recommended)
```bash
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3333"
claude
```

### Option 2: Update ~/.claude/settings.json
```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_BASE_URL": "http://localhost:3333"
  }
}
```

## Usage

1. **Start the proxy server** (in one terminal):
   ```bash
   npm run proxy
   # or for debug mode with full logs:
   npm run proxy:debug
   ```

2. **Use Claude Code normally** (in another terminal):
   ```bash
   export ANTHROPIC_AUTH_TOKEN="dummy"
   export ANTHROPIC_BASE_URL="http://localhost:3333"
   claude
   ```

   Claude Code will now use Chutes GLM-4.5-Air model with full tool calling support!

3. **To switch back to regular Claude**:
   ```bash
   unset ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL
   claude
   ```

## Configuration

The proxy uses the following environment variables (in `.env`):

- `CHUTES_API_TOKEN`: Your Chutes API token (required)
- `CHUTES_API_URL`: Chutes API endpoint (default: https://llm.chutes.ai/v1/chat/completions)
- `CHUTES_MODEL`: Model to use (default: zai-org/GLM-4.5-Air)
- `PORT`: Proxy server port (default: 3333)

## Features

✅ **Full tool calling support** - Anthropic `tool_use` ↔ OpenAI `tool_calls` conversion
✅ **Streaming responses** - Real-time token-by-token output
✅ **Comprehensive logging** - Color-coded debug logs for troubleshooting
✅ **Format conversion** - Seamless Anthropic ↔ OpenAI translation
✅ **Free Chutes API** - Use GLM-4.5-Air at no cost
✅ **Multiple models** - Maps to Haiku, Sonnet, and Opus tiers

## Logging

The proxy provides color-coded logs for easy debugging:

- 📥 **Blue** - Incoming requests from Claude Code
- 🔄 **Magenta** - Format conversion operations
- 📤 **Cyan** - Requests forwarded to Chutes API
- ✅ **Green** - Successful operations
- ❌ **Red** - Errors and failures
- 🌊 **Cyan** - Streaming responses

**Normal mode**: Clean, minimal logs
**Debug mode**: Full request/response bodies and conversion details

## Testing

Run the included test scripts:

```bash
# Test Chutes API tool calling
npm run test:tools

# Test proxy with simple message
node test-proxy-simple.js

# Test proxy with tool calling
node test-proxy-tools.js
```

## Documentation

- `RESEARCH.md` - Complete research findings and solution approaches
- `TEST-RESULTS.md` - Chutes API tool calling test results
- `TESTING-GUIDE.md` - Comprehensive guide for testing and debugging the proxy

## License

MIT