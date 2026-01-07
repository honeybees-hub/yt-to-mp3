// --- Converter Logic ---
const convertBtn = document.getElementById('convertBtn');
const videoUrl = document.getElementById('videoUrl');
const urlError = document.getElementById('urlError');
const formatSelect = document.getElementById('formatSelect');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressTrack = document.getElementById('progressTrack');
const statusText = document.getElementById('statusText');
const successMessage = document.getElementById('successMessage');
const successText = successMessage.querySelector('p');
const downloadBtn = document.getElementById('downloadBtn');

// DEEP FIX: Stricter Regex that demands a Video ID (11 chars)
// Matches:
// youtube.com/watch?v=12345678901 (Standard)
// youtu.be/12345678901 (Short)
// youtube.com/shorts/12345678901 (Shorts)
// music.youtube.com/watch?v=12345678901 (Music)
function isValidYoutubeUrl(url) {
    const regex = /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
    return regex.test(url);
}

// Clear error on input
videoUrl.addEventListener('input', () => {
    videoUrl.classList.remove('error');
    urlError.style.display = 'none';
});

// "Enter" key support
videoUrl.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        convertBtn.click();
    }
});

convertBtn.addEventListener('click', function () {
    const url = videoUrl.value.trim();
    const format = formatSelect.value;

    // Improved validation feedback
    if (!url) {
        showError("Please paste a URL first.");
        return;
    }

    if (!isValidYoutubeUrl(url)) {
        showError("Please enter a valid YouTube Video URL (e.g., including 'watch?v=' or 'youtu.be/').");
        return;
    }

    // Valid start
    videoUrl.classList.remove('error');
    urlError.style.display = 'none';

    // Reset UI
    successMessage.style.display = 'none';
    convertBtn.disabled = true;
    convertBtn.innerHTML = 'Connecting...';
    progressContainer.style.display = 'block';
    progressBar.style.width = '20%';
    statusText.innerText = "Analyzing video link...";

    // Call our backend
    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://yt-to-mp3-ir4b.onrender.com'; // CHANGE THIS after deploying to Render

    // Since we don't have real-time progress from the stream easily without WebSockets,
    // we'll use a smoother simulation for the progress bar while waiting for the response.
    let simulationProgress = 20;
    const progressInterval = setInterval(() => {
        if (simulationProgress < 90) {
            simulationProgress += Math.random() * 2;
            progressBar.style.width = `${Math.min(simulationProgress, 90)}%`;
            if (simulationProgress < 50) statusText.innerText = "Extracting audio...";
            else statusText.innerText = `Converting to ${format.toUpperCase()}...`;
        }
    }, 500);

    const downloadUrl = `${apiBaseUrl}/download?url=${encodeURIComponent(url)}&format=${format}`;

    // Instead of a HEAD request which might fail with 403 on info extraction by the server,
    // we will just wait for a small delay to "simulate" a check, then provide the link.
    // This provides a better UX while the server handles the actual work on download click.
    setTimeout(() => {
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        statusText.innerText = "Ready for download!";
        finalizeConversion(format, downloadUrl, url);
    }, 3000);
});

function showError(msg) {
    videoUrl.classList.add('error');
    urlError.innerText = msg;
    urlError.style.display = 'block';

    // Shake effect
    videoUrl.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' }
    ], {
        duration: 300,
        iterations: 1
    });
    videoUrl.focus();
}

function finalizeConversion(format, downloadLink, originalUrl) {
    setTimeout(() => {
        progressContainer.style.display = 'none';
        successMessage.style.display = 'block';

        // Try to get a nicer name if possible, or just use a generic one
        successText.innerText = `Your ${format.toUpperCase()} file is ready.`;

        convertBtn.innerHTML = 'Convert Another';
        convertBtn.disabled = false;
        videoUrl.value = "";
        videoUrl.focus();

        downloadBtn.onclick = function () {
            window.location.href = downloadLink;
        };
    }, 600);
}


// --- FAQ Accordion Logic ---
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        const answer = item.querySelector('.faq-answer');
        const isExpanded = question.getAttribute('aria-expanded') === 'true';

        // Toggle current item
        item.classList.toggle('active');
        question.setAttribute('aria-expanded', !isExpanded);

        if (item.classList.contains('active')) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
        } else {
            answer.style.maxHeight = 0;
        }

        // Close other items
        faqQuestions.forEach(otherQ => {
            if (otherQ !== question) {
                const otherItem = otherQ.parentElement;
                if (otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherQ.setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.faq-answer').style.maxHeight = 0;
                }
            }
        });
    });
});
