/* globals Inject */

Inject.rawBody('page-loading', `
	<div id="initial-page-loading" class="page-loading">
		<div class="loading">
			<i class="icon-spinner animate-pulse"></i>
		</div>
	</div>`
);

RocketChat.settings.get('Site_Url', function() {
	Meteor.defer(function() {
		let baseUrl;
		if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
			baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
		} else {
			baseUrl = '/';
		}
		if (/\/$/.test(baseUrl) === false) {
			baseUrl += '/';
		}
		Inject.rawHead('base', `<base href="${baseUrl}">`);
	});
});

RocketChat.settings.get('GoogleSiteVerification_id', function(key, value) {
	if (value) {
		Inject.rawHead('google-site-verification', `<meta name="google-site-verification" content="${value}" />`);
	} else {
		Inject.rawHead('google-site-verification', '');
	}
});
