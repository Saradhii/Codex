import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const CHUTES_API_URL = process.env.CHUTES_API_URL || "https://llm.chutes.ai/v1/chat/completions";
const CHUTES_MODEL = process.env.CHUTES_MODEL || "zai-org/GLM-4.5-Air";
const PORT = process.env.PORT || 3333;

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK", model: CHUTES_MODEL });
});

// Models endpoint
app.get("/v1/models", (req, res) => {
  res.json({
    object: "list",
    data: [{ id: CHUTES_MODEL, object: "model", created: Date.now(), owned_by: "chutes" }]
  });
});

// Main messages endpoint - simple passthrough
app.post("/v1/messages", async (req, res) => {
  try {
    console.log(`\n=== REQUEST RECEIVED ===`);
    console.log(`[${new Date().toISOString()}] Stream: ${req.body.stream}, Messages: ${req.body.messages?.length}`);

    // Map request to Chutes format
    const chutesReq = {
      model: CHUTES_MODEL,
      messages: req.body.messages.map(msg => {
        if (msg.role === 'user' && msg.content?.tool_result) {
          // Convert tool_result back to text for GLM
          const toolResult = msg.content.tool_result;
          return {
            role: "user",
            content: `Tool result: ${JSON.stringify(toolResult.output)}`
          };
        }

        const content = Array.isArray(msg.content)
          ? msg.content.map(c => c.text || "").join("")
          : (msg.content || "");

        return {
          role: msg.role,
          content: content
        };
      }),
      stream: req.body.stream || false,
      max_tokens: req.body.max_tokens || 1024,
      temperature: req.body.temperature || 0.7
    };

    // Forward to Chutes
    const chutesResp = await fetch(CHUTES_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": req.body.stream ? "text/event-stream" : "application/json"
      },
      body: JSON.stringify(chutesReq)
    });

    if (!chutesResp.ok) {
      const error = await chutesResp.text();
      console.error(`Chutes error: ${chutesResp.status} ${error}`);
      return res.status(chutesResp.status).json({ error: error });
    }

    // Handle streaming
    if (req.body.stream && chutesResp.headers.get("content-type")?.includes("text/event-stream")) {
      console.log("Streaming response...");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Pipe SSE stream directly
      chutesResp.body.pipe(res);

    } else {
      // Non-streaming response
      const chutesData = await chutesResp.json();
      const content = chutesData.choices?.[0]?.message?.content || "";

      // Return GLM response as plain text
      const anthropicResp = {
        id: chutesData.id || `msg_${Date.now()}`,
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: content }],
        model: chutesData.model || CHUTES_MODEL,
        stop_reason: chutesData.choices?.[0]?.finish_reason === "stop" ? "end_turn" : chutesData.choices?.[0]?.finish_reason,
        stop_sequence: null,
        usage: {
          input_tokens: chutesData.usage?.prompt_tokens || 0,
          output_tokens: chutesData.usage?.completion_tokens || 0
        }
      };

      res.json(anthropicResp);
    }

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Simple Chutes Proxy Server Started`);
  console.log(`═`.repeat(60));
  console.log(`\n📍 Proxy Server: http://localhost:${PORT}`);
  console.log(`🤖 Target Model: ${CHUTES_MODEL}`);
  console.log(`🔗 Chutes API: ${CHUTES_API_URL}`);
  console.log(`📁 Config: Using ${process.env.NODE_ENV === 'production' ? 'environment' : '.env'} file`);

  console.log(`\n` + `═`.repeat(60));
  console.log(`\n📋 To use with Claude Code CLI:`);
  console.log(`   1. Update ~/.claude/settings.json:`);
  console.log(`      {`);
  console.log(`        "env": {`);
  console.log(`          "ANTHROPIC_AUTH_TOKEN": "dummy",`);
  console.log(`          "ANTHROPIC_BASE_URL": "http://localhost:${PORT}"`);
  console.log(`        }`);
  console.log(`      }`);
  console.log(`\n   2. Or set environment variables:`);
  console.log(`      export ANTHROPIC_AUTH_TOKEN="dummy"`);
  console.log(`      export ANTHROPIC_BASE_URL="http://localhost:${PORT}"`);

  console.log(`\n🔄 To switch back to real Claude:`);
  console.log(`   unset ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL`);
  console.log(`   # Remove env section from ~/.claude/settings.json`);

  console.log(`\n` + `═`.repeat(60));
  console.log(`\n✅ Health check: curl http://localhost:${PORT}`);
  console.log(`🔄 Logs will appear below when requests are made\n`);
});