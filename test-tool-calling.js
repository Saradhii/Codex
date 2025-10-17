import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const CHUTES_API_URL = process.env.CHUTES_API_URL || "https://llm.chutes.ai/v1/chat/completions";
const CHUTES_API_TOKEN = process.env.CHUTES_API_TOKEN;
const CHUTES_MODEL = process.env.CHUTES_MODEL || "zai-org/GLM-4.5-Air";

console.log("🧪 Testing Chutes API Tool Calling Capabilities\n");
console.log("=" .repeat(60));
console.log(`API URL: ${CHUTES_API_URL}`);
console.log(`Model: ${CHUTES_MODEL}`);
console.log("=" .repeat(60) + "\n");

// Test 1: OpenAI-style function calling
async function testOpenAIStyleFunctionCalling() {
  console.log("📝 Test 1: OpenAI-Style Function Calling Format\n");

  const payload = {
    model: CHUTES_MODEL,
    messages: [
      {
        role: "user",
        content: "What's the weather like in San Francisco?"
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather in a given location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA"
              },
              unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"],
                description: "The unit of temperature"
              }
            },
            required: ["location"]
          }
        }
      }
    ],
    tool_choice: "auto"
  };

  try {
    console.log("Request payload:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("\nSending request...\n");

    const response = await fetch(CHUTES_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHUTES_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response body:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n");

    // Check if tool calling is present
    if (data.choices && data.choices[0]) {
      const message = data.choices[0].message;

      if (message.tool_calls) {
        console.log("✅ SUCCESS: Tool calls detected in response!");
        console.log("Tool calls:", JSON.stringify(message.tool_calls, null, 2));
        return true;
      } else if (message.function_call) {
        console.log("✅ SUCCESS: Function call detected (legacy format)!");
        console.log("Function call:", JSON.stringify(message.function_call, null, 2));
        return true;
      } else {
        console.log("❌ FAIL: No tool calls in response");
        console.log("Response content:", message.content);
        return false;
      }
    } else {
      console.log("❌ ERROR: Unexpected response structure");
      return false;
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return false;
  }
}

// Test 2: Simple function calling with explicit tool choice
async function testExplicitToolChoice() {
  console.log("\n" + "=" .repeat(60));
  console.log("📝 Test 2: Explicit Tool Choice (Force Tool Call)\n");

  const payload = {
    model: CHUTES_MODEL,
    messages: [
      {
        role: "user",
        content: "Get the weather for New York"
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string" }
            },
            required: ["location"]
          }
        }
      }
    ],
    tool_choice: {
      type: "function",
      function: { name: "get_weather" }
    }
  };

  try {
    console.log("Request: Forcing tool call to 'get_weather'\n");

    const response = await fetch(CHUTES_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHUTES_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response body:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n");

    if (data.choices && data.choices[0]) {
      const message = data.choices[0].message;

      if (message.tool_calls || message.function_call) {
        console.log("✅ SUCCESS: Forced tool call worked!");
        return true;
      } else {
        console.log("❌ FAIL: Tool choice ignored, got text response instead");
        return false;
      }
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return false;
  }
}

// Test 3: Check if parallel function calling is supported
async function testParallelFunctionCalling() {
  console.log("\n" + "=" .repeat(60));
  console.log("📝 Test 3: Parallel Function Calling\n");

  const payload = {
    model: CHUTES_MODEL,
    messages: [
      {
        role: "user",
        content: "What's the weather in San Francisco and New York?"
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string" }
            },
            required: ["location"]
          }
        }
      }
    ],
    parallel_tool_calls: true
  };

  try {
    console.log("Request: Testing parallel tool calls\n");

    const response = await fetch(CHUTES_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CHUTES_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log("Response status:", response.status);
    console.log("Response body:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n");

    if (data.choices && data.choices[0]) {
      const message = data.choices[0].message;

      if (message.tool_calls && message.tool_calls.length > 1) {
        console.log("✅ SUCCESS: Parallel tool calling supported!");
        console.log(`Found ${message.tool_calls.length} tool calls`);
        return true;
      } else if (message.tool_calls && message.tool_calls.length === 1) {
        console.log("⚠️  PARTIAL: Single tool call made (parallel might not be supported)");
        return false;
      } else {
        console.log("❌ FAIL: No tool calls detected");
        return false;
      }
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  if (!CHUTES_API_TOKEN) {
    console.error("❌ ERROR: CHUTES_API_TOKEN not found in .env file");
    console.error("Please add your Chutes API token to .env");
    process.exit(1);
  }

  const results = {
    test1: false,
    test2: false,
    test3: false
  };

  results.test1 = await testOpenAIStyleFunctionCalling();
  results.test2 = await testExplicitToolChoice();
  results.test3 = await testParallelFunctionCalling();

  // Summary
  console.log("\n" + "=" .repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=" .repeat(60));
  console.log(`Test 1 (OpenAI-style tool calling): ${results.test1 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Test 2 (Explicit tool choice):       ${results.test2 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Test 3 (Parallel tool calling):      ${results.test3 ? "✅ PASS" : "❌ FAIL"}`);
  console.log("=" .repeat(60));

  const passCount = Object.values(results).filter(r => r).length;

  if (passCount === 3) {
    console.log("\n🎉 EXCELLENT: Chutes fully supports tool calling!");
    console.log("Next step: Implement Anthropic ↔ OpenAI format conversion proxy");
  } else if (passCount > 0) {
    console.log("\n⚠️  PARTIAL: Chutes has some tool calling support");
    console.log("Next step: Investigate which features are available");
  } else {
    console.log("\n❌ NO SUPPORT: Chutes does not appear to support tool calling");
    console.log("Recommendation: Switch to Z.AI ($3/month) or OpenRouter");
  }
}

// Run tests
runAllTests().catch(console.error);
