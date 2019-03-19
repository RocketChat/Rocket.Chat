import { Autoupdate } from 'meteor/autoupdate';

export const addServerUrlToIndex = (file) => file.replace('<body>', `<body><script> SERVER_URL = '${ __meteor_runtime_config__.ROOT_URL }'; </script>`);

export const addServerUrlToHead = (head) => {
	let baseUrl;
	if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
		baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	} else {
		baseUrl = '/';
	}
	if (/\/$/.test(baseUrl) === false) {
		baseUrl += '/';
	}

	return `<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="${ baseUrl }livechat/livechat.css?_dc=${ Autoupdate.autoupdateVersion }">
			<script type="text/javascript">
				__meteor_runtime_config__ = ${ JSON.stringify(__meteor_runtime_config__) };
			</script>
			<base href="${ baseUrl }">
			${ head }
		</head>
		<body>
			<script type="text/javascript" src="${ baseUrl }livechat/livechat.js?_dc=${ Autoupdate.autoupdateVersion }"></script>
		</body>
	</html>`;
};
