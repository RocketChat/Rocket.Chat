import { randomUUID } from 'crypto';

import { WebApp } from 'meteor/webapp';

const response = (nonce: string) => `
<!DOCTYPE html>
<html>
<head>
    <title>Web Page with Message Event</title>
</head>
<body>
    <script nonce="${nonce}">
        // Function to send a message event to the parent window when this page loads
        function sendInitialMessage() {
            // Check if the page has a parent window (to avoid cross-origin issues)
            if (window.parent) {
                // Send a message event to the parent window
                window.parent.postMessage({ type: 'pageLoad' }, '*');
            }
        }

        // Listen for the 'login' message event from the parent window
        window.addEventListener('message', function (event) {
            const data = event.data;
            // Check if the event type is 'login'
            if (data.event === 'login' && data.loginToken) {
                // Store the provided string in local storage with key 'Meteor.loginToken'
                localStorage.setItem('Meteor.loginToken', data.loginToken);

                window.location.href = window.location.href.replace('/iframeLogin', data.location ?? '/home');
            }
        });

        // Call the function to send the initial message to the parent window when this page loads
        sendInitialMessage();
    </script>
</body>
</html>`;

WebApp.rawConnectHandlers.use('/iframeLogin', async (_req, res) => {
	res.setHeader('Cache-Control', 'public, max-age=31536000');
	res.setHeader('Content-Type', 'text/html; charset=utf-8');

	const nonce = randomUUID();

	res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

	res.writeHead(200);
	res.end(response(nonce));
});
