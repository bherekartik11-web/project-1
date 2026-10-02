# Mockly

Mockly is a browser-based interview practice app. Choose one of six roles and an experience level, answer a role-specific question by typing or speaking, and get immediate practice notes about context, actions, and outcomes. Completed rounds are stored in your browser on this device.

## Run locally

Requirements: Node.js 18 or newer. No package installation or external service credentials are needed.

```sh
npm start
```

Open http://127.0.0.1:3000. To use another port, set `PORT` before running the command. You can also open `index.html` directly, though speech recognition support and browser storage can vary when a page is opened as a local file.

## Project structure

```text
.
├── app.js        # Interview questions, answer feedback, voice input, browser history
├── index.html    # Responsive Mockly landing page and practice interface
├── package.json  # Run script and Node version requirement
├── README.md     # Setup and usage
└── server.js     # Dependency-free local static file server
```

## Data and privacy

Answers are analyzed in the browser with transparent, rule-based guidance; they are not sent to an AI service. Practice history is kept in `localStorage` under `mockly.practice.v1` and can be cleared from the page. Voice input uses the browser's Web Speech API where supported and requires microphone permission; browsers may process speech using their own services.
