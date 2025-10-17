#!/usr/bin/env node

import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import { anthropicToOpenAI, openAIToAnthropic, openAIStreamToAnthropic } from "./format-converter.js";

dotenv.config();

// Parse CLI arguments
const args = process.argv.slice(2);
let cliDebug = false;
let cliPort = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--debug' || arg === '-d') {
    cliDebug = true;
  } else if (arg === '--port' || arg === '-p') {
    cliPort = parseInt(args[++i]);
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Codex Proxy - Claude Code to Chutes GLM Format Conversion Proxy

Usage:
  codex-proxy [options]

Options:
  --debug, -d        Enable debug logging (verbose output)
  --port, -p <port>  Set proxy server port (default: 3333)
  --help, -h         Show this help message

Examples:
  codex-proxy                    Start proxy on default port 3333
  codex-proxy --debug            Start with debug logging enabled
  codex-proxy --port 4000        Start on port 4000
  codex-proxy -p 4000 -d         Start on port 4000 with debug logging

Configure Claude Code:
  export ANTHROPIC_AUTH_TOKEN="dummy"
  export ANTHROPIC_BASE_URL="http://localhost:3333"
  claude

For more info: https://github.com/yourusername/codex-proxy
`);
    process.exit(0);
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Configuration with hardcoded defaults (can be overridden by environment variables)
const CHUTES_API_TOKEN = process.env.CHUTES_API_TOKEN || "cpk_f3594e7f33e34d7f838548efa1a6cd23.fe615caf1963556da89d0cf539a5595a.E1idJbvD2s1V7C1yPF8tdySXPIvZEg1e";
const CHUTES_API_URL = process.env.CHUTES_API_URL || "https://llm.chutes.ai/v1/chat/completions";
const CHUTES_MODEL = process.env.CHUTES_MODEL || "zai-org/GLM-4.5-Air";
const PORT = cliPort || parseInt(process.env.PORT) || 3333;
const DEBUG = cliDebug || process.env.DEBUG === 'true';

// Logging utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: colors.cyan,
    WARN: colors.yellow,
    ERROR: colors.red,
    SUCCESS: colors.green,
    DEBUG: colors.magenta
  };

  const color = levelColors[level] || colors.white;
  console.log(`${color}[${timestamp}] [${level}]${colors.reset} ${message}`);

  if (data && DEBUG) {
    console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
  }
}

function logRequest(req) {
  const separator = '='.repeat(80);
  console.log(`\n${colors.bright}${colors.blue}${separator}${colors.reset}`);
  log('INFO', `📥 Incoming Request: ${req.method} ${req.path}`);
  log('DEBUG', 'Headers:', req.headers);
  log('DEBUG', 'Body:', req.body);
  console.log(`${colors.blue}${separator}${colors.reset}\n`);
}

function logConversion(direction, input, output) {
  if (!DEBUG) return;

  const arrow = direction === 'to-openai' ? '→' : '←';
  log('DEBUG', `🔄 Format Conversion ${arrow} ${direction.toUpperCase()}`);
  console.log(`${colors.dim}Input:${colors.reset}`);
  console.log(JSON.stringify(input, null, 2));
  console.log(`${colors.dim}Output:${colors.reset}`);
  console.log(JSON.stringify(output, null, 2));
  console.log();
}

function logChutesRequest(url, payload) {
  log('INFO', `📤 Forwarding to Chutes: ${url}`);
  log('DEBUG', 'Chutes Request Payload:', payload);
}

function logChutesResponse(status, data) {
  if (status >= 200 && status < 300) {
    log('SUCCESS', `✅ Chutes Response: ${status}`);
  } else {
    log('ERROR', `❌ Chutes Error Response: ${status}`);
  }
  log('DEBUG', 'Chutes Response Data:', data);
}

function logFinalResponse(response) {
  log('SUCCESS', '📤 Sending Final Response to Claude Code');
  log('DEBUG', 'Final Response:', response);
}

// Health check
app.get("/", (req, res) => {
  log('INFO', 'Health check requested');
  res.json({
    status: "OK",
    service: "Anthropic <-> OpenAI Proxy for Chutes GLM",
    backend: CHUTES_API_URL,
    model: CHUTES_MODEL,
    version: "1.0.0"
  });
});

// Models endpoint (required by Claude Code)
app.get("/v1/models", (req, res) => {
  log('INFO', 'Models list requested');
  res.json({
    object: "list",
    data: [
      {
        id: "claude-3-5-sonnet-20241022",
        object: "model",
        created: Date.now(),
        owned_by: "anthropic"
      },
      {
        id: "claude-3-opus-20240229",
        object: "model",
        created: Date.now(),
        owned_by: "anthropic"
      },
      {
        id: "claude-3-haiku-20240307",
        object: "model",
        created: Date.now(),
        owned_by: "anthropic"
      }
    ]
  });
});

// Main messages endpoint - Anthropic to OpenAI conversion
app.post("/v1/messages", async (req, res) => {
  try {
    logRequest(req);

    const anthropicRequest = req.body;

    // Convert Anthropic request to OpenAI format
    log('INFO', '🔄 Converting Anthropic format to OpenAI format');
    const openAIRequest = anthropicToOpenAI(anthropicRequest);

    // Override model with our configured Chutes model
    openAIRequest.model = CHUTES_MODEL;

    logConversion('to-openai', anthropicRequest, openAIRequest);

    // Forward to Chutes
    logChutesRequest(CHUTES_API_URL, openAIRequest);

    const chutesResponse = await fetch(CHUTES_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": anthropicRequest.stream ? "text/event-stream" : "application/json"
      },
      body: JSON.stringify(openAIRequest)
    });

    if (!chutesResponse.ok) {
      const error = await chutesResponse.text();
      log('ERROR', `Chutes API error: ${chutesResponse.status}`);
      log('ERROR', 'Error details:', error);
      return res.status(chutesResponse.status).json({
        type: "error",
        error: {
          type: "api_error",
          message: error
        }
      });
    }

    // Handle streaming
    if (anthropicRequest.stream && chutesResponse.headers.get("content-type")?.includes("text/event-stream")) {
      log('INFO', '🌊 Streaming response detected');

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let buffer = '';

      chutesResponse.body.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
              log('INFO', '🏁 Stream completed');
              continue;
            }

            try {
              const openAIChunk = JSON.parse(data);
              const anthropicEvent = openAIStreamToAnthropic(openAIChunk);

              if (anthropicEvent) {
                res.write(`event: ${anthropicEvent.type}\n`);
                res.write(`data: ${JSON.stringify(anthropicEvent)}\n\n`);

                if (DEBUG && anthropicEvent.type === 'content_block_delta') {
                  process.stdout.write(colors.green + (anthropicEvent.delta.text || '') + colors.reset);
                }
              }
            } catch (e) {
              log('ERROR', 'Failed to parse SSE chunk', e.message);
            }
          }
        }
      });

      chutesResponse.body.on('end', () => {
        res.end();
        log('SUCCESS', '✅ Stream ended successfully');
      });

      chutesResponse.body.on('error', (error) => {
        log('ERROR', '❌ Stream error', error.message);
        res.end();
      });

    } else {
      // Non-streaming response
      log('INFO', '📄 Non-streaming response');

      const openAIResponse = await chutesResponse.json();
      logChutesResponse(chutesResponse.status, openAIResponse);

      // Convert OpenAI response to Anthropic format
      log('INFO', '🔄 Converting OpenAI format to Anthropic format');
      const anthropicResponse = openAIToAnthropic(openAIResponse);

      logConversion('to-anthropic', openAIResponse, anthropicResponse);
      logFinalResponse(anthropicResponse);

      res.json(anthropicResponse);
    }

  } catch (error) {
    log('ERROR', '❌ Proxy error', error.message);
    console.error(error.stack);
    res.status(500).json({
      type: "error",
      error: {
        type: "api_error",
        message: error.message
      }
    });
  }
});

// Animation helper function
async function printWithDelay(text, delay = 50) {
  process.stdout.write(text);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Start server
app.listen(PORT, async () => {
  const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Anthropic <-> OpenAI Proxy Server                       ║
║                                                               ║
║   Enables Claude Code to work with Chutes GLM models         ║
║   via format conversion                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

${colors.bright}Configuration:${colors.reset}
  Proxy Server:    http://localhost:${PORT}
  Backend API:     ${CHUTES_API_URL}
  Target Model:    ${CHUTES_MODEL}
  Debug Mode:      ${DEBUG ? colors.green + 'ENABLED' : colors.dim + 'DISABLED'}${colors.reset}

${colors.bright}Endpoints:${colors.reset}
  GET  /              Health check
  GET  /v1/models     List available models
  POST /v1/messages   Main proxy endpoint (Anthropic format)

${colors.bright}To use with Claude Code:${colors.reset}
  ${colors.cyan}export ANTHROPIC_AUTH_TOKEN="dummy"${colors.reset}
  ${colors.cyan}export ANTHROPIC_BASE_URL="http://localhost:${PORT}"${colors.reset}
  ${colors.cyan}claude${colors.reset}

${colors.bright}Configuration:${colors.reset}
  CHUTES_API_TOKEN   ✓ ${colors.green}Configured${colors.reset}
  CHUTES_API_URL     ✓ ${colors.green}${CHUTES_API_URL}${colors.reset}
  CHUTES_MODEL       ✓ ${colors.green}${CHUTES_MODEL}${colors.reset}
  PORT               ✓ ${colors.green}${PORT}${colors.reset}
  DEBUG              ✓ ${DEBUG ? colors.green + 'Enabled' : colors.yellow + 'Disabled'}${colors.reset}

${colors.bright}Logs:${colors.reset}
  📥 Blue    = Incoming requests
  🔄 Magenta = Format conversions
  📤 Cyan    = Outgoing to Chutes
  ✅ Green   = Success
  ❌ Red     = Errors
  🌊 Cyan    = Streaming
`;

  console.log(banner);

  // Animated ASCII art signature
  const asciiLines = [
    ``,
    `${colors.yellow}⚡${colors.reset} ${colors.bright}Built by:${colors.reset}`,
    ``,
    `${colors.cyan}${colors.bright}                                 .___.__    .__${colors.reset}`,
    `${colors.cyan}${colors.bright} ___________ ____________     __| _/|  |__ |__|${colors.reset}`,
    `${colors.cyan}${colors.bright}/  ___/\\__  \\_  __ \\__  \\   / __ | |  |  \\|  |${colors.reset}`,
    `${colors.cyan}${colors.bright}\\___ \\  / __ \\|  | \\// __ \\_/ /_/ | |   Y  \\  |${colors.reset}`,
    `${colors.cyan}${colors.bright}/____  >(____  /__|  (____  /\\____ | |___|  /__|${colors.reset}`,
    `${colors.cyan}${colors.bright}     \\/      \\/           \\/      \\/      \\/    ${colors.reset}`,
    ``
  ];

  // Print ASCII art with typewriter effect
  for (const line of asciiLines) {
    await printWithDelay(line + '\n', 40);
  }

  console.log(`${colors.green}${colors.bright}✨ Server ready! Waiting for requests...${colors.reset}\n`);
});
