/* globals WebApp:true */

WebApp = Package.webapp.WebApp;
const Autoupdate = Package.autoupdate.Autoupdate;

WebApp.connectHandlers.use('/livechat/', (req, res/*, next*/) => {
	res.setHeader('content-type', 'text/html; charset=utf-8');

	const head = Assets.getText('public/head.html');

	const html = `<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="/packages/rocketchat_livechat/public/livechat.css?_dc=${Autoupdate.autoupdateVersion}">
			<script type="text/javascript">
				__meteor_runtime_config__ = ${JSON.stringify(__meteor_runtime_config__)};
			</script>
			<script type="text/javascript" src="/packages/rocketchat_livechat/public/livechat.js?_dc=${Autoupdate.autoupdateVersion}"></script>

			${head}
		</head>
		<body>
		</body>
	</html>`;

	res.write(html);
	res.end();
});
