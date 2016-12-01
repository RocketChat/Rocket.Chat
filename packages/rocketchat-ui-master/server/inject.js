/* globals Inject */

Inject.rawBody('page-loading', `
<style>
.loading {
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	align-items: center;
	position: absolute;
	justify-content: center;
	text-align: center;
}
.loading > div {
	width: 10px;
	height: 10px;
	margin: 2px;
	border-radius: 100%;
	display: inline-block;
	-webkit-animation: loading-bouncedelay 1.4s infinite ease-in-out both;
	animation: loading-bouncedelay 1.4s infinite ease-in-out both;
}
.loading .bounce1 {
	-webkit-animation-delay: -0.32s;
	animation-delay: -0.32s;
}
.loading .bounce2 {
	-webkit-animation-delay: -0.16s;
	animation-delay: -0.16s;
}
@-webkit-keyframes loading-bouncedelay {
	0%, 80%, 100% { -webkit-transform: scale(0) }
	40% { -webkit-transform: scale(1.0) }
}
@keyframes loading-bouncedelay {
	0%, 80%, 100% { transform: scale(0); }
	40% { transform: scale(1.0); }
}
</style>
<div id="initial-page-loading" class="page-loading">
	<div class="loading">
		<div class="bounce1"></div>
		<div class="bounce2"></div>
		<div class="bounce3"></div>
	</div>
</div>`);


RocketChat.settings.get('theme-color-primary-background-color', function(key, value = '#04436a') {
	Inject.rawHead(key, `<style>body { background-color: ${value};}</style>`);
});

RocketChat.settings.get('theme-color-component-color', function(key, value = '#cccccc') {
	Inject.rawHead(key, `<style>.loading > div { background-color: ${value};}</style>`);
});

RocketChat.settings.get('Accounts_ForgetUserSessionOnWindowClose', function(key, value) {
	if (value) {
		Inject.rawModHtml(key, function(html) {
			const script = `
				<script>
					if (Meteor._localStorage._data === undefined && window.sessionStorage) {
						Meteor._localStorage = window.sessionStorage;
					}
				</script>
			`;
			return html.replace(/<\/body>/, script + '\n</body>');
		});
	} else {
		Inject.rawModHtml(key, function(html) {
			return html;
		});
	}
});

RocketChat.settings.get('Site_Name', function(key, value = 'Rocket.Chat') {
	Inject.rawHead(key,
		`<title>${value}</title>` +
		`<meta name="application-name" content="${value}">` +
		`<meta name="apple-mobile-web-app-title" content="${value}">`);
});

RocketChat.settings.get('Meta_language', function(key, value = '') {
	Inject.rawHead(key,
		`<meta http-equiv="content-language" content="${value}">` +
		`<meta name="language" content="${value}">`);
});

RocketChat.settings.get('Meta_robots', function(key, value = '') {
	Inject.rawHead(key, `<meta name="robots" content="${value}">`);
});

RocketChat.settings.get('Meta_msvalidate01', function(key, value = '') {
	Inject.rawHead(key, `<meta name="msvalidate.01" content="${value}">`);
});

RocketChat.settings.get('Meta_google-site-verification', function(key, value = '') {
	Inject.rawHead(key, `<meta name="google-site-verification" content="${value}" />`);
});

RocketChat.settings.get('Meta_fb_app_id', function(key, value = '') {
	Inject.rawHead(key, `<meta property="fb:app_id" content="${value}">`);
});

RocketChat.settings.get('Meta_custom', function(key, value = '') {
	Inject.rawHead(key, value);
});

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

