import fetch from "node-fetch";

const PROXY_URL = "http://localhost:3333/v1/messages";

async function testSimpleMessage() {
  console.log("🧪 Testing Proxy with Simple Message\n");

  const anthropicRequest = {
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: "Say hello in exactly 5 words!"
      }
    ]
  };

  console.log("📤 Sending Anthropic-format request to proxy...\n");

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

    if (data.type === "message" && data.role === "assistant") {
      console.log("\n✨ SUCCESS: Proxy correctly converted response to Anthropic format!");
    } else {
      console.log("\n❌ FAIL: Response is not in Anthropic format");
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

testSimpleMessage();
