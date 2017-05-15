/* globals Inject */

Inject.rawHead('page-loading', `
<style>
.loading-animation {
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
.loading-animation > div {
	width: 10px;
	height: 10px;
	margin: 2px;
	border-radius: 100%;
	display: inline-block;
	background-color: rgba(255,255,255,0.6);
	-webkit-animation: loading-bouncedelay 1.4s infinite ease-in-out both;
	animation: loading-bouncedelay 1.4s infinite ease-in-out both;
}
.loading-animation .bounce1 {
	-webkit-animation-delay: -0.32s;
	animation-delay: -0.32s;
}
.loading-animation .bounce2 {
	-webkit-animation-delay: -0.16s;
	animation-delay: -0.16s;
}
@-webkit-keyframes loading-bouncedelay {
	0%,
	80%,
	100% { -webkit-transform: scale(0) }
	40% { -webkit-transform: scale(1.0) }
}
@keyframes loading-bouncedelay {
	0%,
	80%,
	100% { transform: scale(0); }
	40% { transform: scale(1.0); }
}
</style>`);

Inject.rawBody('page-loading-div', `
<div id="initial-page-loading" class="page-loading">
	<div class="loading-animation">
		<div class="bounce1"></div>
		<div class="bounce2"></div>
		<div class="bounce3"></div>
	</div>
</div>`);

if (process.env.DISABLE_ANIMATION || process.env.TEST_MODE === 'true') {
	Inject.rawHead('disable-animation', `
	<style>
		body, body * {
			animation: none !important;
			transition: none !important;
		}
	</style>
	<script>
		window.DISABLE_ANIMATION = true;
	</script>
	`);
}

RocketChat.settings.get('Assets_SvgFavicon_Enable', (key, value) => {
	const standardFavicons = `
		<link rel="icon" sizes="16x16" type="image/png" href="assets/favicon_16.png" />
		<link rel="icon" sizes="32x32" type="image/png" href="assets/favicon_32.png" />`;

	if (value) {
		Inject.rawHead(key,
			`${ standardFavicons }
			<link rel="icon" sizes="any" type="image/svg+xml" href="assets/favicon.svg" />`);
	} else {
		Inject.rawHead(key, standardFavicons);
	}
});

RocketChat.settings.get('theme-color-primary-background-color', (key, value = '#04436a') => {
	Inject.rawHead(key, `<style>body { background-color: ${ value };}</style>` +
						`<meta name="msapplication-TileColor" content="${ value }" />` +
						`<meta name="theme-color" content="${ value }" />`);
});

RocketChat.settings.get('Accounts_ForgetUserSessionOnWindowClose', (key, value) => {
	if (value) {
		Inject.rawModHtml(key, (html) => {
			const script = `
				<script>
					if (Meteor._localStorage._data === undefined && window.sessionStorage) {
						Meteor._localStorage = window.sessionStorage;
					}
				</script>
			`;
			return html.replace(/<\/body>/, `${ script }\n</body>`);
		});
	} else {
		Inject.rawModHtml(key, (html) => {
			return html;
		});
	}
});

RocketChat.settings.get('Site_Name', (key, value = 'Rocket.Chat') => {
	Inject.rawHead(key,
		`<title>${ value }</title>` +
		`<meta name="application-name" content="${ value }">` +
		`<meta name="apple-mobile-web-app-title" content="${ value }">`);
});

RocketChat.settings.get('Meta_language', (key, value = '') => {
	Inject.rawHead(key,
		`<meta http-equiv="content-language" content="${ value }">` +
		`<meta name="language" content="${ value }">`);
});

RocketChat.settings.get('Meta_robots', (key, value = '') => {
	Inject.rawHead(key, `<meta name="robots" content="${ value }">`);
});

RocketChat.settings.get('Meta_msvalidate01', (key, value = '') => {
	Inject.rawHead(key, `<meta name="msvalidate.01" content="${ value }">`);
});

RocketChat.settings.get('Meta_google-site-verification', (key, value = '') => {
	Inject.rawHead(key, `<meta name="google-site-verification" content="${ value }" />`);
});

RocketChat.settings.get('Meta_fb_app_id', (key, value = '') => {
	Inject.rawHead(key, `<meta property="fb:app_id" content="${ value }">`);
});

RocketChat.settings.get('Meta_custom', (key, value = '') => {
	Inject.rawHead(key, value);
});

Meteor.defer(() => {
	let baseUrl;
	if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
		baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	} else {
		baseUrl = '/';
	}
	if (/\/$/.test(baseUrl) === false) {
		baseUrl += '/';
	}
	Inject.rawHead('base', `<base href="${ baseUrl }">`);
});

