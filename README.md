# Rich Dad Poor Dad – Q&A Bot

An interactive **Progressive Web App (PWA)** that lets you ask questions about the book *Rich Dad Poor Dad* by Robert Kiyosaki and get answers drawn directly from the book's content.

## Features

- 💬 **Conversational Q&A** – Ask any question about financial literacy, assets, liabilities, investing, cash flow, and more.
- 📱 **Installable PWA** – Install on your phone or desktop like a native app (no app store needed).
- 🔌 **Works Offline** – Service worker caches all assets so the bot works without an internet connection after the first load.
- ⚡ **Fully Client-Side** – No server required. Runs entirely in the browser, ready for GitHub Pages.
- 🔍 **Smart Search** – TF-IDF keyword scoring finds the most relevant passages from the book to answer your question.

## Getting Started

### Open in Browser

Simply open `index.html` in any modern browser, or serve it via any static file server:

```bash
# Using Python's built-in server
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

### Deploy to GitHub Pages

1. Go to your repository **Settings → Pages**.
2. Set the source to the `main` branch, root folder (`/`).
3. Save and visit `https://<your-username>.github.io/<repo-name>/`.

### Install as an App

- **Mobile (Android/iOS):** Open the site in Chrome or Safari, tap the browser menu, and choose **"Add to Home Screen"** or **"Install App"**.
- **Desktop (Chrome/Edge):** Click the install icon in the address bar, or use the install banner that appears in the app.

## Project Structure

```
├── index.html            # Main app page (chat UI)
├── manifest.json         # PWA manifest
├── service-worker.js     # Offline caching service worker
├── css/
│   └── style.css         # Responsive dark-theme styles
├── js/
│   ├── bot.js            # Q&A engine (TF-IDF keyword search)
│   └── app.js            # UI interaction logic
├── data/
│   └── richdad_poordad.txt  # Book content knowledge base
└── icons/                # PWA icons (72px – 512px)
```

## How It Works

1. On startup, the app fetches and parses `data/richdad_poordad.txt`.
2. The text is split into paragraphs and an inverted index is built.
3. When you submit a question, keywords are extracted (stop words removed) and each paragraph is scored using TF-IDF weighting.
4. The top-matching paragraphs are returned as the answer.

## Example Questions

- What is an asset?
- What is the difference between the rich dad and poor dad?
- How do I achieve financial freedom?
- What does "pay yourself first" mean?
- Why is cash flow important?
- What does Rich Dad say about taxes?
