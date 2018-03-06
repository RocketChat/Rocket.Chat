/* globals Inject */
import _ from 'underscore';

const renderDynamicCssList = _.debounce(Meteor.bindEnvironment(() => {
	// const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
	const colors = RocketChat.models.Settings.find({_id:/theme-color-rc/i}, {fields: { value: 1, editor: 1}}).fetch().filter(color => color && color.value);

	if (!colors) {
		return;
	}
	const css = colors.map(({_id, value, editor}) => {
		if (editor === 'expression') {
			return `--${ _id.replace('theme-color-', '') }: var(--${ value });`;
		}
		return `--${ _id.replace('theme-color-', '') }: ${ value };`;
	}).join('\n');
	Inject.rawBody('dynamic-variables', `<style id='css-variables'> :root {${ css }}</style>`);
}), 500);

renderDynamicCssList();

// RocketChat.models.Settings.find({_id:'theme-custom-variables'}, {fields: { value: 1}}).observe({
// 	changed: renderDynamicCssList
// });

RocketChat.models.Settings.find({_id:/theme-color-rc/i}, {fields: { value: 1}}).observe({
	changed: renderDynamicCssList
});

Inject.rawHead('dynamic', `<script>(${ require('./dynamic-css.js').default.toString().replace(/\/\/.*?\n/g, '') })()</script>`);

Inject.rawHead('page-loading', `<style>${ Assets.getText('public/loading.css') }</style>`);

Inject.rawBody('icons', Assets.getText('public/icons.svg'));

Inject.rawBody('page-loading-div', `
<div id="initial-page-loading" class="page-loading">
	<div class="loading-animation">
		<div class="bounce bounce1"></div>
		<div class="bounce bounce2"></div>
		<div class="bounce bounce3"></div>
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

RocketChat.settings.get('theme-color-sidebar-background', (key, value) => {
	Inject.rawHead(key, `<meta name="msapplication-TileColor" content="${ value }" />` +
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
