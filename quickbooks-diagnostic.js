/**
 * QuickBooks Diagnostic Script
 * This script helps diagnose QuickBooks connectivity issues
 */

const { exec } = require("child_process");
const os = require("os");

console.log("🔍 QuickBooks Desktop Diagnostic Tool");
console.log("=====================================");
console.log("📅 Timestamp:", new Date().toISOString());
console.log("💻 Platform:", os.platform());
console.log("🏠 Architecture:", os.arch());

// Function to check if QuickBooks is running
function checkQuickBooksProcess() {
  return new Promise((resolve) => {
    console.log("\n🔎 Checking QuickBooks processes...");

    const command =
      os.platform() === "win32"
        ? 'tasklist /FI "IMAGENAME eq QBW32.exe" /FO CSV'
        : "ps aux | grep -i quickbooks";

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log("❌ Error checking processes:", error.message);
        resolve(false);
        return;
      }

      const isRunning =
        stdout.includes("QBW32.exe") || stdout.includes("qbw.exe");

      if (isRunning) {
        console.log("✅ QuickBooks Desktop process found");
        console.log("📋 Process info:", stdout.trim());
      } else {
        console.log("❌ QuickBooks Desktop process NOT found");
        console.log("💡 Solution: Start QuickBooks Desktop");
      }

      resolve(isRunning);
    });
  });
}

// Function to check Windows services
function checkQuickBooksServices() {
  return new Promise((resolve) => {
    if (os.platform() !== "win32") {
      console.log("⏭️  Skipping service check (not Windows)");
      resolve(true);
      return;
    }

    console.log("\n🔎 Checking QuickBooks services...");

    exec("sc query QBFCService", (error, stdout, stderr) => {
      if (error) {
        console.log("❌ QBFCService not found or not running");
      } else {
        console.log(
          "✅ QBFCService status:",
          stdout.includes("RUNNING") ? "RUNNING" : "NOT RUNNING"
        );
      }
      resolve(true);
    });
  });
}

// Function to test server connectivity
function testServerConnectivity() {
  return new Promise((resolve) => {
    console.log("\n🔎 Testing server connectivity...");

    const http = require("http");
    const options = {
      hostname: "localhost",
      port: 8000,
      path: "/wsdl",
      method: "GET",
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      console.log("✅ Server is accessible on port 8000");
      console.log("📋 Status code:", res.statusCode);
      resolve(true);
    });

    req.on("error", (error) => {
      console.log("❌ Server connectivity error:", error.message);
      console.log("💡 Solution: Ensure your server is running on port 8000");
      resolve(false);
    });

    req.on("timeout", () => {
      console.log("❌ Server connection timeout");
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Main diagnostic function
async function runDiagnostics() {
  console.log("\n🚀 Starting diagnostics...\n");

  const qbRunning = await checkQuickBooksProcess();
  await checkQuickBooksServices();
  const serverRunning = await testServerConnectivity();

  console.log("\n📊 DIAGNOSTIC SUMMARY");
  console.log("====================");
  console.log(
    "QuickBooks Desktop:",
    qbRunning ? "✅ RUNNING" : "❌ NOT RUNNING"
  );
  console.log(
    "Server (Port 8000):",
    serverRunning ? "✅ ACCESSIBLE" : "❌ NOT ACCESSIBLE"
  );

  console.log("\n💡 RECOMMENDED ACTIONS:");

  if (!qbRunning) {
    console.log("1. ❗ Start QuickBooks Desktop as Administrator");
    console.log("2. ❗ Open your company file");
    console.log(
      "3. ❗ Switch to Single-user Mode (File → Switch to Single-user Mode)"
    );
  }

  if (!serverRunning) {
    console.log("4. ❗ Start your Node.js server (npm run dev)");
  }

  if (qbRunning && serverRunning) {
    console.log("✅ All systems appear ready!");
    console.log("🔗 Try connecting QuickBooks Web Connector now");
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Follow the recommended actions above");
  console.log("2. Try connecting QuickBooks Web Connector");
  console.log("3. Check server logs for detailed error information");
}

// Run diagnostics
runDiagnostics().catch(console.error);
