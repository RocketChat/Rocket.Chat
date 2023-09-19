import { WebApp } from 'meteor/webapp';

import { getURL } from '../../app/utils/server/getURL';

const getPage = (scriptUrl: string) => `
	<!DOCTYPE html>
	<html>
		<head>
			<title>iframe login</title>
		</head>
		<body>
			<script type="text/javascript" src="${scriptUrl}"></script>
		</body>
	</html>
`;

WebApp.rawConnectHandlers.use('/iframeLogin', async (_req, res) => {
	res.setHeader('Cache-Control', 'public, max-age=31536000');
	res.setHeader('Content-Type', 'text/html; charset=utf-8');

	res.writeHead(200);
	res.end(getPage(getURL('/iframe/login.js')));
});
