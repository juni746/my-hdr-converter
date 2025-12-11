const express = require("express");
const ffmpeg = require("./ffmpeg");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Helper: download file from URL
async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);
  const response = await axios({ url, method: "GET", responseType: "stream" });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

app.post("/convert", async (req, res) => {
  const { input } = req.body;
  if (!input) return res.status(400).json({ error: "Input URL required" });

  try {
    const tempInput = "/tmp/input.webm";
    const tempOutput = "/tmp/output.mp4";

    // Step 1: Download video
    await downloadFile(input, tempInput);

    // Step 2: Convert HDR WebM → HLG MP4
    await ffmpeg(tempInput, tempOutput);

    // Step 3: Send output file back
    res.download(tempOutput, "converted.mp4", err => {
      if (err) console.error(err);

      // cleanup
      fs.unlinkSync(tempInput);
      fs.unlinkSync(tempOutput);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("HDR Converter API running...");
});
