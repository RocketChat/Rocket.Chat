/* globals WebApp:true */
import _ from 'underscore';
import url from 'url';

WebApp = Package.webapp.WebApp;
const Autoupdate = Package.autoupdate.Autoupdate;

WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
	const reqUrl = url.parse(req.url);
	if (reqUrl.pathname !== '/') {
		return next();
	}
	res.setHeader('content-type', 'text/html; charset=utf-8');

	let domainWhiteList = RocketChat.settings.get('Livechat_AllowedDomainsList');
	if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
		domainWhiteList = _.map(domainWhiteList.split(','), function(domain) {
			return domain.trim();
		});

		const referer = url.parse(req.headers.referer);
		if (!_.contains(domainWhiteList, referer.host)) {
			res.setHeader('X-FRAME-OPTIONS', 'DENY');
			return next();
		}

		res.setHeader('X-FRAME-OPTIONS', `ALLOW-FROM ${ referer.protocol }//${ referer.host }`);
	}

	const head = Assets.getText('public/head.html');

	let baseUrl;
	if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
		baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	} else {
		baseUrl = '/';
	}
	if (/\/$/.test(baseUrl) === false) {
		baseUrl += '/';
	}

	const html = `<html>
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

	res.write(html);
	res.end();
}));
