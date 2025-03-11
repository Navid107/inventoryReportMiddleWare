import dotenv from "dotenv";
import { promises as fs } from "fs";
import { generateToken } from "./auth.js";
import { promisify } from "util";
import zlib from "zlib";
import axios from "axios";
import InventoryReport from "./models/InventoryReport.js";

const gunzip = promisify(zlib.gunzip);

dotenv.config();

function generateDates() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)

  // Calculate the last Saturday
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - dayOfWeek - 1);

  // Calculate the previous Sunday (6 days before the last Saturday)
  const previousSunday = new Date(lastSaturday);
  previousSunday.setDate(lastSaturday.getDate() - 6);
  // Format dates in ISO 8601 format
  const formatDate = (date) => date.toISOString().replace('Z', '');

  return {
    dataStartTime: formatDate(previousSunday),
    dataEndTime: formatDate(lastSaturday),
  };
}

// Generate dates
const dates = generateDates();
const dataStartTime = dates.dataStartTime;
const dataEndTime = dates.dataEndTime;

// Get Sales Report
async function getSalesReport(req) {
  console.log("Starting session for getReport function");
  try {
    const accessToken = req.headers["x-amz-access-token"];
    if (!accessToken) {
      throw new Error("x-amz-access-token is required");
    }

    console.log("Access token received:", accessToken);

    const payload = {
      marketplaceIds: ["ATVPDKIKX0DER"],
      reportType: "GET_VENDOR_INVENTORY_REPORT",
      reportOptions: {
        reportPeriod: "WEEK",
        distributorView: "SOURCING",
        sellingProgram: "RETAIL",
      },
      dataStartTime: dataStartTime,
      dataEndTime: dataEndTime,
    };

    console.log("Payload for report creation:", payload);

    const response = await axios({
      method: "POST",
      url: "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports",
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
      data: payload,
    });

    console.log("Report creation response:", JSON.stringify(response.data, null, 2));

    if (response.data.reportId) {
      const programToken = generateToken();
      console.log("Generated program token:", programToken);
      const report = new InventoryReport({
        token: programToken,
        content: response.data,
      });
      console.log("Response data to be saved:", JSON.stringify(response.data, null, 2));
      const savedReport = await report.save();
      console.log("Saved report:", savedReport);
      await getReportId(response.data.reportId, programToken, accessToken);

      // End session after all operations
      endSession();
      return { token: programToken };
    } else {
      throw new Error("Report ID not found in the response");
    }
  } catch (error) {
    console.error("Error in getReport:", error.message);

    // Save the error to the database
    const errorReport = new InventoryReport({
      token: generateToken(),
      content: { error: error.message },
    });
    await errorReport.save();

    // End session in case of error
    endSession();
    return { error: error.message };
  }
}


async function getInventoryReport(req) {
  console.log("Starting session for getReport function");
  try {
    const accessToken = req.headers["x-amz-access-token"];
    if (!accessToken) {
      throw new Error("x-amz-access-token is required");
    }

    console.log("Access token received:", accessToken);

    const payload = {
      marketplaceIds: ["ATVPDKIKX0DER"],
      reportType: "GET_VENDOR_INVENTORY_REPORT",
      reportOptions: {
        reportPeriod: "WEEK",
        distributorView: "SOURCING",
        sellingProgram: "RETAIL",
      },
      dataStartTime: dataStartTime,
      dataEndTime: dataEndTime,
    };

    console.log("Payload for report creation:", payload);

    const response = await axios({
      method: "POST",
      url: "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports",
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
      data: payload,
    });

    console.log("Report creation response:", JSON.stringify(response.data, null, 2));

    if (response.data.reportId) {
      const programToken = generateToken();
      console.log("Generated program token:", programToken);
      const report = new InventoryReport({
        token: programToken,
        content: response.data,
      });
      console.log("Response data to be saved:", JSON.stringify(response.data, null, 2));
      const savedReport = await report.save();
      console.log("Saved report:", savedReport);
      await getReportId(response.data.reportId, programToken, accessToken);

      // End session after all operations
      endSession();
      return { token: programToken };
    } else {
      throw new Error("Report ID not found in the response");
    }
  } catch (error) {
    console.error("Error in getReport:", error.message);

    // Save the error to the database
    const errorReport = new InventoryReport({
      token: generateToken(),
      content: { error: error.message },
    });
    await errorReport.save();

    // End session in case of error
    endSession();
    return { error: error.message };
  }
}

function endSession() {
  console.log("Ending session and performing cleanup...");
  cleanup();
  console.log("Session ended.");
}

async function getReportId(reportId, programToken, accessToken) {
  console.log("Entering getReportId function with reportId:", reportId);
  try {
    const response = await axios({
      method: "GET",
      url: `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports/${reportId}`,
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log("Report ID response:", JSON.stringify(response.data, null, 2));

    if (
      response.data.processingStatus === "DONE" ||
      response.data.reportDocumentId
    ) {
      console.log("Processing status is DONE or reportDocumentId exists");
      await reportDocument(response.data.reportDocumentId, programToken, accessToken);
    } else if (response.data.processingStatus === "IN_PROGRESS" || response.data.processingStatus === "IN_QUEUE") {
      console.log("Processing status is IN_PROGRESS or IN_QUEUE");
      setTimeout(() => {
        getReportId(reportId, programToken, accessToken);
      }, 30 * 1000); // 30-second delay
    }
  } catch (error) {
    console.error("Error in getReportId:", error.message);

    // Save the error to the database
    await InventoryReport.updateOne(
      { token: programToken },
      { content: { error: error.message } }
    );

    throw error;
  }
}

async function reportDocument(documentId, programToken, accessToken) {
  console.log("Entering reportDocument function with documentId:", documentId);
  try {
    const response = await axios({
      method: "GET",
      url: `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/documents/${documentId}`,
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log("Report document response:", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.url) {
      await downloadAndDecompressReport(response.data.url, programToken);
    }
  } catch (error) {
    console.error("Error in reportDocument:", error.message);

    // Save the error to the database
    await InventoryReport.updateOne(
      { token: programToken },
      { content: { error: error.message } }
    );

    throw error;
  }
}

async function downloadAndDecompressReport(url, programToken) {
  console.log("Entering downloadAndDecompressReport function with URL:", url);
  try {
    console.log("Downloading report from URL...");
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "arraybuffer",
    });

    console.log("Decompressing GZIP data...");
    const decompressed = await gunzip(response.data);
    const content = decompressed.toString("utf-8");

    // Parse the decompressed content as JSON
    const jsonData = JSON.parse(content);

    // Log the JSON data if needed
    console.log("Decompressed JSON data:", jsonData);

    // Update the report in the database with the decompressed content
    const updateResult = await InventoryReport.updateOne(
      { token: programToken },
      { $set: { content: jsonData } }
    );
    console.log("Update result:", updateResult);

    console.log("Report saved to MongoDB");
  } catch (error) {
    console.error("Error in downloadAndDecompressReport:", error.message);
    throw error;
  } finally {
    // Ensure cleanup is always performed
    cleanup();
  }
}

// Define a cleanup function
function cleanup() {
  console.log("Performing cleanup operations...");
  
  // Example: Clear temporary variables
  let tempVariable = null;
  
  // Example: Close any open connections
  // if (connection) {
  //   connection.close();
  // }
  
  // Example: Remove event listeners
  // if (eventEmitter) {
  //   eventEmitter.removeAllListeners();
  // }

  console.log("Cleanup completed.");
}

// Run the report document fetch and download
export { getInventoryReport, getSalesReport };
