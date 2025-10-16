# Chutes-Claude Proxy

A simple proxy server that enables using Chutes GLM models with Claude Code CLI.

## What It Does

This proxy acts as a bridge between Claude Code and the Chutes GLM-4.5-Air model. It:
- Receives requests from Claude Code in Anthropic's API format
- Forwards them to Chutes API
- Returns the GLM response back to Claude Code
- Handles both streaming and non-streaming responses

**Note**: This is a simple passthrough proxy. Tool calling is not natively supported by the GLM model in this setup.

## Setup

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
   ```bash
   npm run dev
   ```

## Configure Claude Code

To use the proxy with Claude Code CLI, update your settings:

### Option 1: Using environment variables
```bash
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3333"
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

1. Start the proxy server:
   ```bash
   npm run dev
   ```

2. Use Claude Code CLI normally. It will automatically route requests through the proxy.

3. To switch back to regular Claude:
   ```bash
   unset ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL
   # Or remove the env section from ~/.claude/settings.json
   ```

## Configuration

The proxy uses the following environment variables (in `.env`):

- `CHUTES_API_TOKEN`: Your Chutes API token (required)
- `CHUTES_API_URL`: Chutes API endpoint (default: https://llm.chutes.ai/v1/chat/completions)
- `CHUTES_MODEL`: Model to use (default: zai-org/GLM-4.5-Air)
- `PORT`: Proxy server port (default: 3333)

## Limitations

- Tool calling is not supported (GLM model returns plain text responses)
- Only supports the GLM-4.5-Air model from Chutes
- Streaming responses are passed through as-is

## Future Enhancements

Planned improvements for tool calling support:
- Implement Model Context Protocol (MCP) integration
- Add intelligent tool call parsing and transformation
- Support for more GLM models

## License

MIT