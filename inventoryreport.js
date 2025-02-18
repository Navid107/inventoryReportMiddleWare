import dotenv from "dotenv";
import { promises as fs } from "fs";
import { getAccessToken } from "./auth.js";
import { promisify } from "util";
import zlib from "zlib";
import axios from "axios";
import InventoryReport from './models/InventoryReport.js';

const gunzip = promisify(zlib.gunzip);

dotenv.config();

function generateDates(durationDays = 7) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + durationDays);

  // Format dates in ISO 8601 format
  const formatDate = (date) => date.toISOString();

  return {
    dataStartTime: formatDate(now),
    dataEndTime: formatDate(endDate),
  };
}

// Generate dates
const dates = generateDates();
const dataStartTime = dates.dataStartTime;
const dataEndTime = dates.dataEndTime;

async function getReport() {
  try {
    const accessToken = await getAccessToken();
    console.log("Access Token:", accessToken);

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

    // Make the API request to create a report
    const response = await axios({
      method: "post",
      url: "https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports",
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
      data: payload,
    });

    console.log(
      "Report creation response:",
      JSON.stringify(response.data, null, 2)
    );
    setTimeout(() => {
      getReportId(response.data.reportId);
    }, 30 * 1000);
    return response.data;
  } catch (error) {
    console.error("Error creating report:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}
async function getReportId(reportId) {
  try {
    const accessToken = await getAccessToken();
    const response = await axios({
      method: "GET",
      url: `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports/${reportId}`,
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
    });
    if (
      response.data.processingStatus === "DONE" ||
      response.data.reportDocumentId
    ) {
      reportDocument(response.data.reportDocumentId);
    } else if (response.data.processingStatus === "IN_PROGRESS") {
      setTimeout(() => {
        reportDocument(response.data.reportDocumentId);
      }, 30 * 1000);
    }
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching report ID:");
    throw error;
  }
}

async function reportDocument(documentId) {
  try {
    const accessToken = await getAccessToken();
    console.log("Access Token:", accessToken);

    // Make the API request to fetch the report document
    const response = await axios({
      method: "get",
      url: `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/documents/${documentId}`,
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
    });

    console.log(
      "Report document info:",
      JSON.stringify(response.data, null, 2)
    );

    // Download the report immediately using the URL from the response
    if (response.data && response.data.url) {
      await downloadAndDecompressReport(response.data.url);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching report document:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", error.response.data);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

async function downloadAndDecompressReport(url) {
  try {
    console.log("Downloading report from URL...");
    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
    });

    console.log("Decompressing GZIP data...");
    const decompressed = await gunzip(response.data);
    const content = decompressed.toString("utf-8");

    // Save both compressed and decompressed versions
    await fs.writeFile("report.gz", response.data);
    await fs.writeFile("report.json", content);

    console.log(
      "Report saved as report.gz (compressed) and report.json (decompressed)"
    );

    // Save to MongoDB
    const report = new InventoryReport({
      content: JSON.parse(content) // Assuming the content is JSON
    });
    await report.save();
    console.log("Report saved to MongoDB");

    return content;
  } catch (error) {
    console.error("Error downloading or decompressing report:", error.message);
    throw error;
  }
}

// Run the report document fetch and download
getReport()
  .then((report) => {
    console.log("Report process completed");
  })
  .catch((error) => {
    console.error("Failed to process report:", error);
  });
