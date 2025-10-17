# Quick Start Guide

Get up and running with Claude Code + Chutes GLM in 5 minutes!

## ✅ Prerequisites

- Node.js 18+ installed
- Chutes API token (get it from https://chutes.ai/)
- Claude Code CLI installed

## 🚀 Setup (3 steps)

### Step 1: Install & Configure

```bash
# Clone or download this project
cd /path/to/Codex

# Install dependencies
npm install

# Copy .env example
cp .env.example .env

# Edit .env and add your Chutes API token
# CHUTES_API_TOKEN=your_token_here
```

### Step 2: Start the Proxy

```bash
# Normal mode (recommended for daily use)
npm run proxy

# OR debug mode (to see everything)
npm run proxy:debug
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║   🚀 Anthropic <-> OpenAI Proxy Server                       ║
╚═══════════════════════════════════════════════════════════════╝

Configuration:
  Proxy Server:    http://localhost:3333
  ...
✨ Server ready! Waiting for requests...
```

### Step 3: Configure & Use Claude Code

In a **new terminal**:

```bash
# Set environment variables
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3333"

# Start Claude Code
claude
```

That's it! 🎉

## 💡 Usage Examples

### Example 1: Simple Chat

```
You: Write a Python function to calculate fibonacci numbers

Claude: I'll write a Python function to calculate Fibonacci numbers...
```

The proxy will:
- Receive the request from Claude Code (Anthropic format)
- Convert to OpenAI format
- Forward to Chutes GLM-4.5-Air
- Convert response back to Anthropic format
- Return to Claude Code

### Example 2: Tool Calling

```
You: Create a new file called hello.py with a hello world function
```

Claude Code will:
1. Plan the task
2. Call the `write_file` tool
3. Write the file
4. Confirm completion

All tool calling works seamlessly through the proxy!

### Example 3: Multiple File Operations

```
You: Refactor the code in src/utils.js to be more readable
```

Claude Code will:
1. Read the file
2. Analyze the code
3. Make improvements
4. Write the updated file
5. Show you the changes

## 🔍 Monitoring

### Watch the Proxy Logs

Keep the proxy terminal open to see:
- Incoming requests (blue)
- Format conversions (magenta)
- Chutes API calls (cyan)
- Success/errors (green/red)

### Debug Mode

For troubleshooting, restart with debug mode:

```bash
# Stop the proxy (Ctrl+C)
# Restart with debug logging
npm run proxy:debug
```

You'll see:
- Full request/response bodies
- Detailed conversion steps
- Tool calling transformations
- Streaming chunk details

## 🧪 Testing

### Test 1: Health Check

```bash
curl http://localhost:3333
```

Expected: JSON response with status "OK"

### Test 2: Simple Message

```bash
node test-proxy-simple.js
```

Expected: "SUCCESS: Proxy correctly converted response"

### Test 3: Tool Calling

```bash
node test-proxy-tools.js
```

Expected: "SUCCESS: Found 1 tool_use block(s)!"

### Test 4: With Claude Code

```bash
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_BASE_URL="http://localhost:3333"
claude

# In Claude Code:
You: Say hello
```

Expected: Claude responds normally, proxy shows logs

## 🐛 Troubleshooting

### Issue: "CHUTES_API_TOKEN not set"

**Solution:** Add your token to `.env`:
```
CHUTES_API_TOKEN=your_actual_token_here
```

### Issue: "Connection refused"

**Solution:** Make sure the proxy is running in another terminal:
```bash
npm run proxy
```

### Issue: Claude Code shows errors

**Solution:**
1. Check proxy is running (`npm run proxy`)
2. Verify env vars are set:
   ```bash
   echo $ANTHROPIC_BASE_URL
   # Should show: http://localhost:3333
   ```
3. Enable debug mode to see what's happening:
   ```bash
   npm run proxy:debug
   ```

### Issue: Tool calling not working

**Solution:**
1. Enable debug mode: `npm run proxy:debug`
2. Look for format conversion logs
3. Check if tools are being converted:
   - Anthropic `input_schema` → OpenAI `parameters` ✓
   - OpenAI `tool_calls` → Anthropic `tool_use` ✓

## 📊 What You Get

| Feature | Status |
|---------|--------|
| Basic chat | ✅ Works |
| Streaming | ✅ Works |
| Tool calling | ✅ Works |
| File operations | ✅ Works |
| Code analysis | ✅ Works |
| Multi-turn conversations | ✅ Works |
| Cost | 🆓 FREE |

## 🎯 Next Steps

1. ✅ Set up the proxy
2. ✅ Test with Claude Code
3. 📖 Read `TESTING-GUIDE.md` for advanced debugging
4. 📖 Read `RESEARCH.md` to understand how it works
5. 🚀 Start coding with Claude Code + FREE GLM models!

## 💰 Cost Comparison

| Option | Cost | Tool Calling |
|--------|------|--------------|
| **Chutes GLM-4.5-Air (This proxy)** | **FREE** | **✅ Yes** |
| Claude 3.5 Sonnet (Anthropic) | $3/M tokens | ✅ Yes |
| Z.AI GLM Coding Plan | $3/month | ✅ Yes |
| OpenRouter GLM | Pay-per-use | ✅ Yes |

You're getting **enterprise-grade tool calling** with a **free model**! 🎉

## 🆘 Need Help?

1. Check `TESTING-GUIDE.md` for detailed troubleshooting
2. Enable debug mode to see full logs
3. Test Chutes API directly: `npm run test:tools`
4. Check the proxy logs for errors

## 🔄 Switching Back to Regular Claude

```bash
unset ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL
claude
```

Or just close the terminal and open a new one.

---

**Congratulations!** You're now using Claude Code with FREE Chutes GLM models with full tool calling support! 🚀
