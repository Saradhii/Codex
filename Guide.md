# 🧠 Claude Code + Chutes GLM-4.5 Streaming Proxy

This project provides a robust streaming proxy that allows Claude Code CLI to use Chutes GLM models with full streaming support. The proxy translates between Anthropic's API format and Chutes' API format, maintaining real-time token-by-token responses.

## 📋 Project Structure

```
chutes-claude-proxy/
├── src/
│   └── proxy.js          # Enhanced proxy server with streaming support
├── test/
│   └── test-proxy.js     # Test script to validate the proxy
├── .env                  # Environment variables (create this)
├── .env.example          # Example environment variables
├── package.json          # Project configuration
└── Guide.md             # This guide
```

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm
pnpm install
```

### 2️⃣ Configure Environment

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Chutes API key:

```env
CHUTES_API_KEY=cpk_your_api_key_here
CHUTES_API_URL=https://llm.chutes.ai/v1/chat/completions
CHUTES_MODEL=zai-org/GLM-4.5-Air
PORT=3001
```

### 3️⃣ Run the Proxy Server

```bash
# Using npm
npm run dev

# Or using pnpm
pnpm run dev
```

Expected output:

```
🚀 Chutes Streaming Proxy is running
📍 Local:    http://localhost:3001
🎯 Target:   https://llm.chutes.ai/v1/chat/completions
🤖 Model:    zai-org/GLM-4.5-Air

📝 To use with Claude Code:
   export ANTHROPIC_AUTH_TOKEN="dummy"
   export ANTHROPIC_BASE_URL="http://localhost:3001/v1"
   export API_TIMEOUT_MS=300000

⌨️  Then run: claude
```

### 4️⃣ Configure Claude Code

In a new terminal, set these environment variables:

```bash
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3001/v1"
export API_TIMEOUT_MS=300000
```

Now run Claude Code:

```bash
claude
```

## 🧪 Test the Proxy

Run the test script to verify everything works:

```bash
npm test
```

This will test both streaming and non-streaming responses.

## ✨ Features

- **Full Streaming Support**: Real-time token-by-token responses
- **Response Transformation**: Converts Chutes responses to Anthropic's format
- **Error Handling**: Proper error messages and logging
- **Health Check**: `/` endpoint shows proxy status
- **Models Endpoint**: `/v1/models` lists available models
- **Debug Logging**: Optional debug output for troubleshooting

## 🔧 Advanced Configuration

### Custom Model

Change the model in `.env`:

```env
CHUTES_MODEL=zai-org/GLM-4.5-Air
```

### Custom Port

Change the proxy port:

```env
PORT=8080
```

### Debug Mode

Enable debug logging:

```env
DEBUG=true
```

## 🚨 Troubleshooting

### Proxy won't start
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check if port is already in use

### Claude Code can't connect
- Verify proxy is running
- Check `ANTHROPIC_BASE_URL` is correct
- Ensure port number matches

### Streaming not working
- Check Chutes API key is valid
- Verify `CHUTES_API_URL` is correct
- Check browser console for errors

### Common Errors

1. **"ECONNREFUSED"**: Proxy server isn't running
2. **"401 Unauthorized"**: Invalid API key
3. **"404 Not Found"**: Incorrect API URL
4. **"Timeout"**: Increase `API_TIMEOUT_MS`

## 📊 API Mapping

| Claude Code | Chutes API |
|------------|------------|
| `messages` | `messages` |
| `max_tokens` | `max_tokens` |
| `temperature` | `temperature` |
| `stream: true` | `stream: true` |
| SSE events | Server-Sent Events |

## 🛠️ Development

### Project Scripts

- `npm run dev` or `pnpm run dev`: Start proxy server
- `npm start` or `pnpm start`: Start proxy server
- `npm test` or `pnpm test`: Run tests

### Code Structure

The proxy handles:
1. **Request Transformation**: Converts Anthropic format to Chutes format
2. **Streaming**: Properly forwards SSE streams
3. **Response Transformation**: Converts Chutes responses back to Anthropic format
4. **Error Handling**: Maps error messages appropriately

## 📝 License

MIT License