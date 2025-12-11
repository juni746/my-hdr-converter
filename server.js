const express = require("express");
const ffmpeg = require("./ffmpeg");
const app = express();

app.use(express.json());

app.post("/convert", async (req, res) => {
    const { input, output } = req.body;

    try {
        await ffmpeg(input, output);
        res.json({ success: true, message: "Converted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on Render");
});
