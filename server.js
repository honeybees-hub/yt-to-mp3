const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

app.get('/download', async (req, res) => {
    try {
        const videoURL = req.query.url;
        const format = req.query.format || 'mp3';

        if (!videoURL) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Requested download for: ${videoURL} in ${format} format`);

        // Set headers for download
        res.header('Content-Disposition', `attachment; filename="audio.${format}"`);
        res.header('Content-Type', 'audio/mpeg');

        // Direct path to yt-dlp binary
        let ytDlpPath = 'yt-dlp'; // Default for Linux (Render)

        if (process.platform === 'win32') {
            ytDlpPath = path.join(__dirname, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
        }

        console.log(`Using binary: ${ytDlpPath}`);

        // Spawn yt-dlp to stream audio
        const child = spawn(ytDlpPath, [
            videoURL,
            '-f', 'bestaudio',
            '-o', '-',
            '--no-playlist',
            '--no-check-certificate',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]);

        child.stdout.pipe(res);

        child.stderr.on('data', (data) => {
            console.log(`yt-dlp info: ${data}`);
        });

        child.on('error', (err) => {
            console.error('yt-dlp Spawn Error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to start download process' });
            }
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp process exited with code ${code}`);
                // Note: If code is not 0, the stream might have been cut early or failed.
            }
        });

        // Kill child process on client disconnect
        req.on('close', () => {
            child.kill();
        });

    } catch (err) {
        console.error('Server Catch Error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
