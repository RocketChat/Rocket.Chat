import { withKnobs } from '@storybook/addon-knobs';
import { MINIMAL_VIEWPORTS, INITIAL_VIEWPORTS } from '@storybook/addon-viewport/dist/defaults';
import { addDecorator, addParameters, configure } from '@storybook/react';
import i18next from 'i18next';
import React from 'react';

import { TranslationContext } from '../client/contexts/TranslationContext';

addParameters({
	viewport: {
		viewports: {
			...MINIMAL_VIEWPORTS,
			...INITIAL_VIEWPORTS,
		},
		defaultViewport: 'responsive',
	},
});

let contextValue;

const getContextValue = () => {
	if (contextValue) {
		return contextValue;
	}

	i18next.init({
		fallbackLng: 'en',
		defaultNS: 'project',
		resources: {
			en: {
				project: require('../packages/rocketchat-i18n/i18n/en.i18n.json'),
			},
		},
		interpolation: {
			prefix: '__',
			suffix: '__',
		},
		initImmediate: false,
	});

	const translate = (key, ...replaces) => {
		if (typeof replaces[0] === 'object') {
			const [options] = replaces;
			return i18next.t(key, options);
		}

		if (replaces.length === 0) {
			return i18next.t(key);
		}

		return i18next.t(key, {
			postProcess: 'sprintf',
			sprintf: replaces,
		});
	};

	translate.has = (key) => i18next.exists(key);

	contextValue = {
		languages: [{
			name: 'English',
			en: 'English',
			key: 'en',
		}],
		language: 'en',
		translate,
	};

	return contextValue;
};

export function TranslationProviderMock({ children }) {
	return <TranslationContext.Provider children={children} value={getContextValue()} />;
}

addDecorator(function RocketChatDecorator(fn) {
	const linkElement = document.getElementById('theme-styles') || document.createElement('link');
	if (linkElement.id !== 'theme-styles') {
		require('../app/theme/client/main.css');
		require('../app/theme/client/vendor/fontello/css/fontello.css');
		require('../client/rocketchat.font.css');
		linkElement.setAttribute('id', 'theme-styles');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('href', 'https://open.rocket.chat/theme.css');
		document.head.appendChild(linkElement);
	}

	// eslint-disable-next-line import/no-unresolved
	const { default: icons } = require('!!raw-loader!../private/public/icons.svg');

	return <TranslationProviderMock>
		<style>{`
			body {
				background-color: white;
			}
		`}</style>
		<div dangerouslySetInnerHTML={{ __html: icons }} />
		<div className='global-font-family color-primary-font-color'>
			{fn()}
		</div>
	</TranslationProviderMock>;
});

addDecorator(withKnobs);

configure(require.context('../client', true, /\.stories\.js$/), module);
