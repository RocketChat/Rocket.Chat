import { Meteor } from 'meteor/meteor';
import { Inject } from 'meteor/meteorhacks:inject-initial';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { Settings } from '../../models';
import { settings } from '../../settings/server';
import { applyHeadInjections, headInjections, injectIntoBody, injectIntoHead } from './inject';
import './scripts';

export * from './inject';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const injections = Object.values(headInjections.all());
		Inject.rawModHtml('headInjections', applyHeadInjections(injections));
	});

	settings.watch('Default_Referrer_Policy', (value) => {
		if (!value) {
			return injectIntoHead('noreferrer', '<meta name="referrer" content="same-origin" />');
		}

		injectIntoHead('noreferrer', `<meta name="referrer" content="${value}" />`);
	});

	if (process.env.DISABLE_ANIMATION) {
		injectIntoHead(
			'disable-animation',
			`
		<style>
			body, body * {
				animation: none !important;
			}
			</style>
			`,
		);
	}

	settings.watch('Assets_SvgFavicon_Enable', (value) => {
		const standardFavicons = `
			<link rel="icon" sizes="16x16" type="image/png" href="assets/favicon_16.png" />
			<link rel="icon" sizes="32x32" type="image/png" href="assets/favicon_32.png" />`;

		if (value) {
			injectIntoHead(
				'Assets_SvgFavicon_Enable',
				`${standardFavicons}
				<link rel="icon" sizes="any" type="image/svg+xml" href="assets/favicon.svg" />`,
			);
		} else {
			injectIntoHead('Assets_SvgFavicon_Enable', standardFavicons);
		}
	});

	settings.watch('theme-color-sidebar-background', (value) => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(
			'theme-color-sidebar-background',
			`<meta name="msapplication-TileColor" content="${escapedValue}" /><meta name="theme-color" content="${escapedValue}" />`,
		);
	});

	settings.watch('Site_Name', (value = 'Rocket.Chat') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(
			'Site_Name',
			`<title>${escapedValue}</title>` +
				`<meta name="application-name" content="${escapedValue}">` +
				`<meta name="apple-mobile-web-app-title" content="${escapedValue}">`,
		);
	});

	settings.watch('Meta_language', (value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead(
			'Meta_language',
			`<meta http-equiv="content-language" content="${escapedValue}"><meta name="language" content="${escapedValue}">`,
		);
	});

	settings.watch('Meta_robots', (value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead('Meta_robots', `<meta name="robots" content="${escapedValue}">`);
	});

	settings.watch('Meta_msvalidate01', (value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead('Meta_msvalidate01', `<meta name="msvalidate.01" content="${escapedValue}">`);
	});

	settings.watch('Meta_google-site-verification', (value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead('Meta_google-site-verification', `<meta name="google-site-verification" content="${escapedValue}">`);
	});

	settings.watch('Meta_fb_app_id', (value = '') => {
		const escapedValue = escapeHTML(value);
		injectIntoHead('Meta_fb_app_id', `<meta property="fb:app_id" content="${escapedValue}">`);
	});

	settings.watch('Meta_custom', (value = '') => {
		injectIntoHead('Meta_custom', value);
	});

	const baseUrl = ((prefix) => {
		if (!prefix) {
			return '/';
		}

		prefix = prefix.trim();

		if (!prefix) {
			return '/';
		}

		return /\/$/.test(prefix) ? prefix : `${prefix}/`;
	})(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX);

	injectIntoHead('base', `<base href="${baseUrl}">`);

	injectIntoHead('css-theme', '');
});

const renderDynamicCssList = _.debounce(
	Meteor.bindEnvironment(() => {
		// const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
		const colors = Settings.find({ _id: /theme-color-rc/i }, { fields: { value: 1, editor: 1 } })
			.fetch()
			.filter((color) => color && color.value);

		if (!colors) {
			return;
		}
		const css = colors
			.map(({ _id, value, editor }) => {
				if (editor === 'expression') {
					return `--${_id.replace('theme-color-', '')}: var(--${value});`;
				}
				return `--${_id.replace('theme-color-', '')}: ${value};`;
			})
			.join('\n');
		injectIntoBody('dynamic-variables', `<style id='css-variables'> :root {${css}}</style>`);
	}),
	500,
);

renderDynamicCssList();

// RocketChat.models.Settings.find({_id:'theme-custom-variables'}, {fields: { value: 1}}).observe({
// 	changed: renderDynamicCssList
// });

settings.watchByRegex(/theme-color-rc/i, renderDynamicCssList);

injectIntoBody(
	'react-root',
	`
<div id="react-root">
	<div class="page-loading">
		<div class="loading-animation">
			<div class="bounce bounce1"></div>
			<div class="bounce bounce2"></div>
			<div class="bounce bounce3"></div>
		</div>
	</div>
</div>
`,
);

injectIntoBody('icons', Assets.getText('public/icons.svg'));
