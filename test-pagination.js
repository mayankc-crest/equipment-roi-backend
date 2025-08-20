/*
 * Test script to demonstrate enhanced pagination functionality
 * This script shows how the system fetches different batches of items
 */

const qbXMLHandler = require("./quickbook/qbXMLHandler");

async function testPagination() {
  console.log("🧪 Testing Enhanced Pagination System\n");

  // Test 1: Check initial pagination state
  console.log("📊 Initial Pagination State:");
  console.log(qbXMLHandler.getPaginationStatus());
  console.log("");

  // Test 2: Generate first batch query
  console.log("🔄 Generating First Batch Query:");
  qbXMLHandler.fetchRequests((err, requests) => {
    if (err) {
      console.error("❌ Error:", err);
      return;
    }

    if (requests.length > 0) {
      console.log("📄 Generated Query:");
      console.log(requests[0]);
    } else {
      console.log("ℹ️ No queries generated");
    }
  });

  // Test 3: Simulate processing first batch
  console.log("\n🔄 Simulating First Batch Processing...");

  // Mock response with 5 items
  const mockResponse = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="7.0"?>
<QBXML>
    <QBXMLMsgsRs onError="stopOnError">
        <ItemQueryRs requestID="1739" statusCode="0" statusSeverity="Info" statusMessage="Status OK">
            <ItemServiceRet>
                <ListID>80000001-1234567890</ListID>
                <Name>Product A</Name>
                <FullName>Product A</FullName>
                <IsActive>true</IsActive>
                <SalesOrPurchase>
                    <Desc>Description for Product A</Desc>
                    <Price>100.00</Price>
                    <AccountRef>
                        <FullName>Sales of Product Income</FullName>
                    </AccountRef>
                </SalesOrPurchase>
            </ItemServiceRet>
            <ItemServiceRet>
                <ListID>80000002-1234567890</ListID>
                <Name>Product B</Name>
                <FullName>Product B</FullName>
                <IsActive>true</IsActive>
                <SalesOrPurchase>
                    <Desc>Description for Product B</Desc>
                    <Price>200.00</Price>
                    <AccountRef>
                        <FullName>Sales of Product Income</FullName>
                    </AccountRef>
                </SalesOrPurchase>
            </ItemServiceRet>
            <ItemServiceRet>
                <ListID>80000003-1234567890</ListID>
                <Name>Product C</Name>
                <FullName>Product C</FullName>
                <IsActive>true</IsActive>
                <SalesOrPurchase>
                    <Desc>Description for Product C</Desc>
                    <Price>300.00</Price>
                    <AccountRef>
                        <FullName>Sales of Product Income</FullName>
                    </AccountRef>
                </SalesOrPurchase>
            </ItemServiceRet>
            <ItemServiceRet>
                <ListID>80000004-1234567890</ListID>
                <Name>Product D</Name>
                <FullName>Product D</FullName>
                <IsActive>true</IsActive>
                <SalesOrPurchase>
                    <Desc>Description for Product D</Desc>
                    <Price>400.00</Price>
                    <AccountRef>
                        <FullName>Sales of Product Income</FullName>
                    </AccountRef>
                </SalesOrPurchase>
            </ItemServiceRet>
            <ItemServiceRet>
                <ListID>80000005-1234567890</ListID>
                <Name>Product E</Name>
                <FullName>Product E</FullName>
                <IsActive>true</IsActive>
                <SalesOrPurchase>
                    <Desc>Description for Product E</Desc>
                    <Price>500.00</Price>
                    <AccountRef>
                        <FullName>Sales of Product Income</FullName>
                    </AccountRef>
                </SalesOrPurchase>
            </ItemServiceRet>
        </ItemQueryRs>
    </QBXMLMsgsRs>
</QBXML>`;

  // Process the mock response
  qbXMLHandler.handleResponse(mockResponse);

  // Wait a moment for processing
  setTimeout(() => {
    console.log("\n📊 Updated Pagination State After First Batch:");
    console.log(qbXMLHandler.getPaginationStatus());
    console.log("");

    // Test 4: Generate second batch query
    console.log("🔄 Generating Second Batch Query:");
    qbXMLHandler.fetchRequests((err, requests) => {
      if (err) {
        console.error("❌ Error:", err);
        return;
      }

      if (requests.length > 0) {
        console.log("📄 Generated Query:");
        console.log(requests[0]);
      } else {
        console.log("ℹ️ No queries generated");
      }
    });

    // Test 5: Reset pagination
    console.log("\n🔄 Resetting Pagination...");
    qbXMLHandler.resetPagination();

    console.log("\n📊 Pagination State After Reset:");
    console.log(qbXMLHandler.getPaginationStatus());

    console.log("\n✅ Pagination test completed!");
  }, 1000);
}

// Run the test
testPagination().catch(console.error);
