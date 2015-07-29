WebApp = Package.webapp.WebApp
Autoupdate = Package.autoupdate.Autoupdate

WebApp.connectHandlers.use '/external/', (req, res, next) ->
	res.setHeader 'content-type', 'html'

	head = Assets.getText('public/head.html')

	html = """
	<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="/packages/rocketchat_external/public/external.css?_dc=#{Autoupdate.autoupdateVersion}">
			<script type="text/javascript">
				__meteor_runtime_config__ = {
					"meteorRelease": "METEOR@1.1.0.2",
					"ROOT_URL": "http://localhost:3000/",
					"ROOT_URL_PATH_PREFIX": "",
					"autoupdateVersion": "#{Autoupdate.autoupdateVersion}",
					"autoupdateVersionRefreshable": "#{Autoupdate.autoupdateVersionRefreshable}",
					"autoupdateVersionCordova": "#{Autoupdate.autoupdateVersionCordova}"
				};
			</script>
			<script type="text/javascript" src="/packages/rocketchat_external/public/external.js?_dc=#{Autoupdate.autoupdateVersion}"></script>

			#{head}
		</head>
		<body>
		</body>
	</html>
	"""

	res.write html
	res.end()