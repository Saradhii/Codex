# Research: Tool Calling Compatibility for Claude Code with GLM Models

## Problem Statement

Claude Code expects **Anthropic's specific JSON structure** for tool calling, but GLM-4.5-Air from Chutes returns either:
- Plain text responses, OR
- OpenAI-style function calls (not Anthropic format)

This causes incompatibility where Claude Code cannot properly execute tools, making custom transformation layers impractical since they won't cover all tool calling scenarios.

## How Z.AI Solves This Problem

Z.AI successfully runs Claude Code with GLM models by providing an **Anthropic-compatible API endpoint** at `https://api.z.ai/api/anthropic`.

**Their Approach:**
1. Accept requests in Anthropic format (including tool definitions)
2. Translate tool calls to GLM-4.5/4.6 format internally
3. Execute the model with proper tool calling support
4. Transform responses back to Anthropic format
5. Return properly formatted `tool_use` blocks to Claude Code

**Result:** Zero code changes required in Claude Code - it works seamlessly.

**Cost:** $3/month for GLM Coding Plan

## Alternative CLI Tools Analysis

### 1. Cline (VS Code Extension)
- **Type:** VS Code plugin for AI-assisted coding
- **Repository:** https://github.com/cline/cline
- **Key Features:**
  - Autonomous coding agent
  - Model Context Protocol (MCP) integration
  - Can create and install custom tools
  - Supports multiple API providers (OpenRouter, Anthropic, OpenAI, etc.)
  - Open source with 30k+ stars
- **Tool Calling:** Uses MCP to extend capabilities dynamically
- **Compatibility:** Works with OpenAI-compatible APIs
- **Best For:** VS Code users who want IDE integration

### 2. OpenCode (Terminal CLI)
- **Type:** AI coding agent built for the terminal
- **Repository:** https://github.com/sst/opencode (active fork)
- **Original:** https://github.com/opencode-ai/opencode (archived, now called "Crush")
- **Key Features:**
  - Go-based CLI application
  - Provider-agnostic (OpenAI, Google, local models)
  - Terminal User Interface (TUI)
  - Built-in tools: bash, edit, webfetch, glob, grep, read, write, etc.
- **Tool Calling Issues:**
  - Has compatibility challenges with open source models
  - Some models generate tool calls with incorrect capitalization
  - Example error: Model calls 'Write' instead of 'write'
- **Best For:** Terminal-focused developers, provider flexibility

### 3. Roo Code (VS Code Extension)
- **Type:** VS Code plugin (previously Roo Cline)
- **Repository:** https://github.com/RooCodeInc/Roo-Code
- **Key Features:**
  - Enhanced fork with AI-powered automation
  - Multi-model support
  - VSCode LM Tools Integration
  - Experimental features
- **Limitations:**
  - Requires VS Code UI (no CLI/headless mode)
  - Not suitable for CI/CD pipelines
- **Best For:** VS Code users wanting enhanced Cline features

### 4. Gemini CLI (Modified)
- **Type:** Command-line tool with custom GitHub fork
- **Key Features:**
  - Uses "OpenRouter compatibility"
  - Requires Node.js 18+
  - Custom environment variable configuration
- **Integration:** Modified to work with Z.AI's GLM models via custom API endpoint
- **Best For:** Users familiar with Gemini CLI interface

### 5. Grok CLI
- **Type:** Command-line AI assistant
- **Package:** `@vibe-kit/grok-cli`
- **Installation:** `npm install -g @vibe-kit/grok-cli`
- **Usage:** `grok --model glm-4.6`
- **Limitations:** "Limited compatibility with thinking models"
- **Best For:** Quick terminal-based interactions

## Tool Calling Format Specifications

### Anthropic API Format

**Tool Definition:**
```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state, e.g. San Francisco, CA"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"]
      }
    },
    "required": ["location"]
  }
}
```

**Tool Use Response:**
- `stop_reason`: `tool_use`
- Content blocks include `tool_use` objects with:
  - `id`: Unique identifier for the tool use
  - `name`: Tool name
  - `input`: Object conforming to tool's input_schema

**Specification:** JSON Schema draft 2020-12

### GLM-4.5 / GLM-4.6 API Format

**Function Calling Support:**
- Both models support native function calling
- Uses **OpenAI-compatible format**
- Context: GLM-4.5 (128k), GLM-4.6 (200k)

**Tool Choice Options:**
- `none`: No tool calling
- `auto`: Model chooses between message or tool calling
- `required`: Must call one or more tools
- Specific tool: `{"type": "function", "function": {"name": "my_function"}}`

**Features:**
- Parallel function calling support
- OpenAI-style tool description format
- Tool calling success rate: 90.6% (GLM-4.5)

**vLLM/SGLang Deployment:**
```bash
vllm serve zai-org/GLM-4.5-Air \
  --tensor-parallel-size 8 \
  --tool-call-parser glm45 \
  --reasoning-parser glm45 \
  --enable-auto-tool-choice
```

## Model Context Protocol (MCP)

**Overview:**
- Open standard introduced by Anthropic (November 2024)
- Standardizes AI system integration with external tools and data
- Uses JSON-RPC messages for Client-Server communication

**Three Server Primitives:**
1. **Tools** (Model-controlled): Executable functions LLMs can call
2. **Resources** (Application-controlled): Structured data for context
3. **Prompts** (User-controlled): Instruction templates

**Architecture:**
- Client-server model
- AI apps use MCP client to connect to MCP servers
- Servers front datasources or tools

**Benefits:**
- Standardized tool integration
- Dynamic tool discovery
- Extensible architecture

## Middleware Solutions for Format Conversion

### 1. LiteLLM (Recommended)
- **Repository:** https://github.com/BerriAI/litellm
- **Type:** Python SDK + Proxy Server (LLM Gateway)
- **Supports:** 100+ LLM APIs in unified format

**Key Features:**
- Unified interface using OpenAI Chat format
- Automatic format translation between providers
- MCP tool calling support
- Translates tools from OpenAI format to any provider's format

**How It Works:**
1. Load tools in OpenAI function calling format
2. LiteLLM translates to target provider format
3. Execute through MCP
4. Format results appropriately for each provider
5. Handle complete conversation flow

**Format Support:**
- Input: OpenAI format OR Anthropic v1/messages format
- Output: Translates to target provider (Claude, Azure, Gemini, etc.)

**Pros:**
- Production-ready, actively maintained
- Handles complex tool calling scenarios
- Battle-tested with many providers
- Comprehensive documentation

**Cons:**
- Python dependency
- Heavier than simple proxy

### 2. anthropic-proxy
- **Repository:** https://github.com/maxnowack/anthropic-proxy
- **Author:** maxnowack
- **Type:** Node.js proxy server

**Purpose:**
- Converts Anthropic API requests to OpenAI format
- Sends to OpenRouter.ai
- Enables using Claude Code with OpenRouter

**Configuration:**
```bash
OPENROUTER_API_KEY=your-api-key npx anthropic-proxy
```

**Environment Variables:**
- `OPENROUTER_API_KEY`: Required
- `ANTHROPIC_PROXY_BASE_URL`: Custom routing URL
- `PORT`: Listening port (default 3000)
- `REASONING_MODEL`: Configurable model
- `COMPLETION_MODEL`: Configurable model
- `DEBUG`: Debug logging

**Usage with Claude Code:**
```bash
ANTHROPIC_BASE_URL=http://0.0.0.0:3000 claude
```

**Pros:**
- Lightweight (Node.js)
- Simple, focused solution
- Already handles Anthropic → OpenAI conversion

**Cons:**
- Tool calling conversion not fully documented
- Less maintained than LiteLLM
- May need custom modifications

### 3. PicoAIProxy
- **Repository:** https://github.com/PicoMLX/PicoAIProxy
- **Language:** Server-side Swift
- **Features:**
  - Supports OpenAI and Anthropic
  - Automatic OpenAI Chat API call conversion
  - Reverse proxy architecture

## Chutes.ai Provider Information

**API Endpoint:** `https://llm.chutes.ai/v1/chat/completions`

**Model:** `zai-org/GLM-4.5-Air`
- 106B parameters (12B active)
- Designed for reasoning, coding, and agent applications
- **Currently FREE on Chutes**

**Access Methods:**
- Direct API via Chutes
- OpenRouter (via Chutes provider)
- AI/ML API (as zhipu/glm-4.5-air)
- Together AI
- Fireworks AI

**Tool Calling Support:**
- ✅ **CONFIRMED: Fully supports OpenAI-style tool calling**
- GLM-4.5-Air: 90% tool calling success rate
- Uses `--tool-call-parser glm45` flag in vLLM/SGLang

**Test Results (2025-10-17):**
- ✅ OpenAI-style function calling: WORKS
- ✅ Explicit tool choice: WORKS
- ✅ Parallel tool calling: WORKS
- Response includes `tool_calls` array with proper structure
- Includes `reasoning_content` field showing model's thinking
- Proper `finish_reason: "tool_calls"` when tools are used

## Solution Approaches (Ranked by Simplicity)

### Option 1: Switch to Z.AI API ⭐ SIMPLEST
**Effort:** 5 minutes
**Cost:** $3/month

**Implementation:**
1. Sign up at https://z.ai/
2. Get API key
3. Update `.env`:
   ```
   CHUTES_API_URL=https://api.z.ai/api/anthropic
   CHUTES_API_TOKEN=your_zai_key
   ```
4. Done - tool calling works automatically

**Pros:**
- Zero code changes
- Proven to work
- Server-side handles all transformation
- Professional support

**Cons:**
- Monthly cost ($3)
- Dependent on Z.AI service

### Option 2: Test Chutes Native Tool Calling ✅ COMPLETED
**Effort:** 1-2 hours
**Cost:** Free
**Status:** ✅ SUCCESS - Chutes fully supports tool calling!

**Test Results:**
- Chutes API fully supports OpenAI-style function calling
- Parallel tool calls work correctly
- Explicit tool choice works
- Response format is standard OpenAI-compatible

**Next Step:** Implement Anthropic ↔ OpenAI format conversion proxy

**Pros:**
- ✅ Keeps current free Chutes setup
- ✅ Works with simple proxy conversion

**Cons:**
- None - it works!

### Option 3: Deploy LiteLLM Proxy
**Effort:** 2-4 hours
**Cost:** Free

**Implementation:**
1. Install LiteLLM: `pip install litellm[proxy]`
2. Create config for Chutes endpoint
3. Configure Anthropic → OpenAI → Chutes translation
4. Run proxy server
5. Point Claude Code to LiteLLM proxy

**Pros:**
- Production-ready solution
- Handles 100+ providers
- Automatic tool calling translation
- Well-documented

**Cons:**
- Python dependency
- More complex setup
- Still unknown if Chutes supports tool calling

### Option 4: Fork anthropic-proxy
**Effort:** 4-8 hours
**Cost:** Free

**Implementation:**
1. Clone https://github.com/maxnowack/anthropic-proxy
2. Modify to target Chutes instead of OpenRouter
3. Implement OpenAI → Chutes format transformation
4. Add tool calling translation logic
5. Test with Claude Code

**Pros:**
- Lighter weight (Node.js)
- Full control over implementation
- Learn the internals

**Cons:**
- Need to implement tool calling ourselves
- Maintenance burden
- May miss edge cases

### Option 5: Switch to OpenCode CLI
**Effort:** 1 hour
**Cost:** Free

**Implementation:**
1. Install: `npm install -g opencode-ai`
2. Configure Chutes as OpenAI-compatible endpoint
3. Test tool calling functionality

**Pros:**
- Different CLI, might be better UX
- Provider-agnostic design
- No proxy needed if Chutes supports OpenAI format

**Cons:**
- Not Claude Code (different experience)
- Reported issues with some open models
- Less polished

### Option 6: Use OpenRouter with GLM
**Effort:** 10 minutes
**Cost:** Pay-per-use

**Implementation:**
1. Sign up at https://openrouter.ai/
2. Get API key
3. Use anthropic-proxy to convert formats
4. Point to OpenRouter's GLM models

**Pros:**
- OpenRouter handles tool calling
- Well-established service
- Pay only for usage

**Cons:**
- Not free
- Another middleman service

## Recommended Implementation Order

**Phase 1: Quick Test ✅ COMPLETED**
1. ✅ Test if Chutes API supports OpenAI-style tool calling
2. ✅ Make sample API call with function definitions
3. ✅ Document response format

**Result:** Chutes fully supports OpenAI-style tool calling!

**Phase 2: Implement Format Conversion Proxy (CURRENT)**
Since Chutes supports tool calling in OpenAI format, we now need to:
1. Build or deploy a proxy that converts between Anthropic and OpenAI formats
2. Handle tool calling translation in both directions
3. Test with Claude Code

**Options for Phase 2:**
- **Option A:** Fork and modify anthropic-proxy (lighter, Node.js)
- **Option B:** Use LiteLLM (heavier but more features, Python)

**Recommended:** Start with anthropic-proxy modification (simpler, faster to implement)

## Key Insights

1. **Z.AI's secret sauce:** Server-side Anthropic format compatibility layer
2. **GLM models DO support tool calling** - the question is whether Chutes exposes it
3. **Most CLI tools expect OpenAI or Anthropic format** - not raw GLM format
4. **LiteLLM is the industry standard** for multi-provider tool calling translation
5. **MCP is emerging as the future standard** for tool integration

## Next Steps

Start with **Option 1 (Z.AI)** for immediate results, then:
- If want free solution → Test Chutes tool calling capabilities (Option 2)
- If Chutes works → Deploy simple proxy (anthropic-proxy fork)
- If Chutes doesn't work → Either pay for service (Z.AI/OpenRouter) or explore other CLI tools (OpenCode)

## References

- Anthropic Tool Use: https://docs.anthropic.com/en/docs/tool-use
- Claude Code with Z.AI: https://docs.z.ai/scenario-example/develop-tools/claude
- LiteLLM: https://docs.litellm.ai/
- Cline: https://github.com/cline/cline
- OpenCode: https://github.com/sst/opencode
- MCP Specification: https://github.com/modelcontextprotocol
- anthropic-proxy: https://github.com/maxnowack/anthropic-proxy
- GLM-4.5 Documentation: https://docs.z.ai/guides/llm/glm-4.5
