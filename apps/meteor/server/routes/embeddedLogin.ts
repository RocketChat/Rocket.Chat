import crypto from 'crypto';

import { WebApp } from 'meteor/webapp';

import { settings } from '../../app/settings/server';

const getPage = (nonce: string, receiveOrigins: string[], sendOrigin: string) => `
	<!DOCTYPE html>
	<html>
		<head>
			<title>embedded login</title>
		</head>
		<body>
			<script type="text/javascript" nonce="${nonce}">
				window.addEventListener('message', function (event) {
					const data = event.data;
					const origins = ${JSON.stringify(receiveOrigins)};
					if (origins[0] !== '*' && !origins.some((origin) => origin === event.origin)) {
						console.error('Origin not allowed', event.origin);
						return;
					}
					if (data.event === 'login-with-token' && data.loginToken) {
						localStorage.setItem('Meteor.loginToken', data.loginToken);
				
						window.location.href = window.location.href.replace('/embeddedLogin', data.path ?? '/home');
					}
				});
				
				window.parent.postMessage({ type: 'pageLoad' }, '${sendOrigin}');
			</script>
		</body>
	</html>
`;

const getReceiveOrigins = (origins: string) => {
	const splitOrigins = origins.split(',').map((origin) => origin.trim());
	if (splitOrigins.some((origin) => origin === '*')) {
		return ['*'];
	}

	return splitOrigins;
};

WebApp.rawConnectHandlers.use('/embeddedLogin', async (_req, res) => {
	if (
		!settings.get('Iframe_Integration_send_enable') ||
		!settings.get('Iframe_Integration_receive_enable') ||
		!settings.get('Accounts_iframe_enabled')
	) {
		res.writeHead(403);
		res.end();
	}

	const nonce = crypto.randomBytes(16).toString('base64');

	res.setHeader('Cache-Control', 'public, max-age=31536000');
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

	const receiveOrigins = getReceiveOrigins(settings.get<string>('Iframe_Integration_receive_origin'));
	const sendOrigin = settings.get<string>('Iframe_Integration_send_target_origin');

	if (settings.get('Iframe_Restrict_Access')) {
		res.setHeader('X-Frame-Options', settings.get<string>('Iframe_X_Frame_Options'));
	}

	res.writeHead(200);
	res.end(getPage(nonce, receiveOrigins, sendOrigin));
});
