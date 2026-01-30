// test.js
async function testAPI() {
  console.log("🧪 Testing API...\n");

  // Test 1: Generate replies
  console.log("1️⃣ Testing /generate-replies");
  try {
    const res1 = await fetch("http://localhost:3001/generate-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Customer is asking about their refund status",
        preset: "apology"
      })
    });
    const data1 = await res1.json();
    console.log("✅ Replies generated:");
    data1.replies?.forEach((reply, i) => {
      console.log(`   ${i + 1}. ${reply}`);
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
  }

  console.log("\n2️⃣ Testing /fix-draft");
  try {
    const res2 = await fetch("http://localhost:3001/fix-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: "We is looking into your issue and will gets back to you soon"
      })
    });
    const data2 = await res2.json();
    console.log("✅ Fixed draft:");
    console.log(`   ${data2.fixed}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testAPI();