---
'@rocket.chat/desktop-api': minor
---

Add optional `openInBrowser(url)` method to `IRocketChatDesktop`. Desktop clients can expose this to let the server frontend request that a URL be opened in the user's native browser instead of inside the Electron webview — used by flows that must leave the app, such as phishing-resistant MFA redirects to external identity providers.
