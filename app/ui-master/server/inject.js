import { Meteor } from 'meteor/meteor';
import { Inject } from 'meteor/meteorhacks:inject-initial';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { Settings } from '../../models';
import { settings } from '../../settings/server';

const headInjections = new ReactiveDict();

export const injectIntoHead = (key, value) => {
	headInjections.set(key, value);
};

export const injectIntoBody = (key, value) => {
	Inject.rawBody(key, value);
};

const applyHeadInjections = (injections) => {
	if (injections.length === 0) {
		return (html) => html;
	}

	const replacementHtml = `${ injections.join('\n').replace(/\$/g, '$$$$') }\n</head>`;

	return (html) => html.replace('</head>', replacementHtml);
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		const injections = Object.values(headInjections.all());
		Inject.rawModHtml('headInjections', applyHeadInjections(injections));
	});

	settings.get('Default_Referrer_Policy', (key, value) => {
		if (!value) {
			return injectIntoHead('noreferrer', '<meta name="referrer" content="same-origin" />');
		}

		injectIntoHead('noreferrer', `<meta name="referrer" content="${ value }" />`);
	});

	if (process.env.DISABLE_ANIMATION) {
		injectIntoHead('disable-animation', `
		<style>
			body, body * {
				animation: none !important;
			}
		</style>
		<script>
			window.DISABLE_ANIMATION = true;
		</script>
		`);
	}

	settings.get('API_Use_REST_For_DDP_Calls', (key, value) => {
		if (!value) {
			return injectIntoHead(key, '');
		}
		injectIntoHead(key, '<script>window.USE_REST_FOR_DDP_CALLS = true;</script>');
	});

	settings.get('Assets_SvgFavicon_Enable', (key, value) => {
		const standardFavicons = `
			<link rel="icon" sizes="16x16" type="image/png" href="assets/favicon_16.png" />
			<link rel="icon" sizes="32x32" type="image/png" href="assets/favicon_32.png" />`;

		if (value) {
			injectIntoHead(key,
				`${ standardFavicons }
				<link rel="icon" sizes="any" type="image/svg+xml" href="assets/favicon.svg" />`);
		} else {
			injectIntoHead(key, standardFavicons);
		}
	});

	settings.get('theme-color-sidebar-background', (key, value) => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key, `<meta name="msapplication-TileColor" content="${ escapedValue }" />`
							+ `<meta name="theme-color" content="${ escapedValue }" />`);
	});

	settings.get('Site_Name', (key, value = 'Rocket.Chat') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key,
			`<title>${ escapedValue }</title>`
			+ `<meta name="application-name" content="${ escapedValue }">`
			+ `<meta name="apple-mobile-web-app-title" content="${ escapedValue }">`);
	});

	settings.get('Meta_language', (key, value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key,
			`<meta http-equiv="content-language" content="${ escapedValue }">`
			+ `<meta name="language" content="${ escapedValue }">`);
	});

	settings.get('Meta_robots', (key, value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key, `<meta name="robots" content="${ escapedValue }">`);
	});

	settings.get('Meta_msvalidate01', (key, value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key, `<meta name="msvalidate.01" content="${ escapedValue }">`);
	});

	settings.get('Meta_google-site-verification', (key, value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key, `<meta name="google-site-verification" content="${ escapedValue }">`);
	});

	settings.get('Meta_fb_app_id', (key, value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(key, `<meta property="fb:app_id" content="${ escapedValue }">`);
	});

	settings.get('Meta_custom', (key, value = '') => {
		injectIntoHead(key, value);
	});

	const baseUrl = ((prefix) => {
		if (!prefix) {
			return '/';
		}

		prefix = prefix.trim();

		if (!prefix) {
			return '/';
		}

		return /\/$/.test(prefix) ? prefix : `${ prefix }/`;
	})(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX);

	injectIntoHead('base', `<base href="${ baseUrl }">`);

	injectIntoHead('css-theme', '');
});

const renderDynamicCssList = _.debounce(Meteor.bindEnvironment(() => {
	// const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
	const colors = Settings.find({ _id: /theme-color-rc/i }, { fields: { value: 1, editor: 1 } }).fetch().filter((color) => color && color.value);

	if (!colors) {
		return;
	}
	const css = colors.map(({ _id, value, editor }) => {
		if (editor === 'expression') {
			return `--${ _id.replace('theme-color-', '') }: var(--${ value });`;
		}
		return `--${ _id.replace('theme-color-', '') }: ${ value };`;
	}).join('\n');
	injectIntoBody('dynamic-variables', `<style id='css-variables'> :root {${ css }}</style>`);
}), 500);

renderDynamicCssList();

// RocketChat.models.Settings.find({_id:'theme-custom-variables'}, {fields: { value: 1}}).observe({
// 	changed: renderDynamicCssList
// });

settings.get(/theme-color-rc/i, () => renderDynamicCssList());

injectIntoBody('react-root', `
<div id="react-root">
	<div class="page-loading">
		<div class="loading-animation">
			<div class="bounce bounce1"></div>
			<div class="bounce bounce2"></div>
			<div class="bounce bounce3"></div>
		</div>
	</div>
</div>
`);

injectIntoBody('icons', Assets.getText('public/icons.svg'));

settings.get('Accounts_ForgetUserSessionOnWindowClose', (key, value) => {
	if (value) {
		Inject.rawModHtml(key, (html) => {
			const script = `
<script>
	window.addEventListener('load', function() {
		if (window.localStorage) {
			Object.keys(window.localStorage).forEach(function(key) {
				window.sessionStorage.setItem(key, window.localStorage.getItem(key));
			});
			window.localStorage.clear();
			Meteor._localStorage = window.sessionStorage;
		}
	});
</script>
			`;
			return html + script;
		});
	} else {
		Inject.rawModHtml(key, (html) => html);
	}
});
