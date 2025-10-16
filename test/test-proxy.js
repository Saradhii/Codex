import fetch from "node-fetch";

const PROXY_URL = "http://localhost:3001/v1/messages";

async function testProxy() {
  console.log("🧪 Testing Chutes Proxy Server...\n");

  try {
    // Test 1: Non-streaming request
    console.log("1️⃣ Testing non-streaming request...");
    const nonStreamResponse = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer dummy"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Say 'Hello from Chutes!' in exactly 5 words."
          }
        ],
        stream: false
      })
    });

    if (nonStreamResponse.ok) {
      const data = await nonStreamResponse.json();
      console.log("✅ Non-streaming test passed!");
      console.log("Response:", data.content[0]?.text?.substring(0, 100) + "...\n");
    } else {
      console.log("❌ Non-streaming test failed:", nonStreamResponse.statusText, await nonStreamResponse.text());
    }

    // Test 2: Streaming request
    console.log("2️⃣ Testing streaming request...");
    const streamResponse = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer dummy"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: "Count from 1 to 5 slowly."
          }
        ],
        stream: true
      })
    });

    if (streamResponse.ok) {
      console.log("✅ Streaming test initiated!");
      console.log("Streaming response:");

      let fullText = "";
      const decoder = new TextDecoder();

      for await (const chunk of streamResponse.body) {
        const text = decoder.decode(chunk);
        process.stdout.write(text);

        // Extract text content from SSE events
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.delta?.text) {
                fullText += data.delta.text;
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      console.log("\n\n✅ Streaming test completed!");
      console.log("Full response:", fullText);
    } else {
      console.log("❌ Streaming test failed:", streamResponse.statusText, await streamResponse.text());
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
    console.log("\n💡 Make sure the proxy server is running with: pnpm run dev");
  }
}

// Run tests
testProxy();