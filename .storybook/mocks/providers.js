import i18next from 'i18next';
import React from 'react';

import { TranslationContext } from '../../client/contexts/TranslationContext';

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
				project: require('../../packages/rocketchat-i18n/i18n/en.i18n.json'),
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

	translate.has = (key) => key && i18next.exists(key);

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

function TranslationProviderMock({ children }) {
	return <TranslationContext.Provider children={children} value={getContextValue()} />;
}

export function MeteorProviderMock({ children }) {
	return <TranslationProviderMock>
		{children}
	</TranslationProviderMock>;
}
