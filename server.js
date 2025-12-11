
const express = require("express");
const ffmpeg = require("./ffmpeg");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(express.json());

// Multer setup for file upload
const upload = multer({ dest: "/tmp" });

/* ------------------------------------------
   OPTION 1 — Upload a Local File (iPhone friendly)
   POST /convert with form-data:
   video: <file>
--------------------------------------------- */

app.post("/convert", upload.single("video"), async (req, res) => {
  try {
    // If file uploaded
    if (req.file) {
      const inputPath = req.file.path;
      const outputPath = "/tmp/output.mp4";

      await ffmpeg(inputPath, outputPath);

      return res.download(outputPath, "converted.mp4", () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    }

    // If no file uploaded → check for URL
    if (!req.body.input) {
      return res.status(400).json({
        error: "Upload a file using form-data 'video' or send JSON { input: 'URL' }"
      });
    }

    /* ------------------------------------------
       OPTION 2 — Convert from URL
    --------------------------------------------- */

    const videoURL = req.body.input;
    const tempInput = "/tmp/input.webm";
    const tempOutput = "/tmp/output.mp4";

    // Download video file
    const writer = fs.createWriteStream(tempInput);
    const response = await axios({
      url: videoURL,
      method: "GET",
      responseType: "stream"
    });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Convert
    await ffmpeg(tempInput, tempOutput);

    // Return output
    res.download(tempOutput, "converted.mp4", () => {
      fs.unlinkSync(tempInput);
      fs.unlinkSync(tempOutput);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------
   BASIC HOME ROUTE
--------------------------------------------- */
app.get("/", (req, res) => {
  res.send("HDR Converter API is running");
});

/* ------------------------------------------ */

app.listen(process.env.PORT || 5000, () => {
  console.log("HDR Converter API running...");
});
