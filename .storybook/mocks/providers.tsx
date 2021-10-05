import i18next from 'i18next';
import React, { PropsWithChildren, ReactElement } from 'react';

import { TranslationContext, TranslationContextValue } from '../../client/contexts/TranslationContext';
import ServerProvider from '../../client/providers/ServerProvider';

let contextValue: TranslationContextValue;

const getContextValue = (): TranslationContextValue => {
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

	const translate = (key: string, ...replaces: unknown[]): string => {
		if (typeof replaces[0] === 'object' && replaces[0] !== null) {
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

	translate.has = (key: string): boolean => !!key && i18next.exists(key);

	contextValue = {
		languages: [{
			name: 'English',
			en: 'English',
			key: 'en',
		}],
		language: 'en',
		translate,
		loadLanguage: async (): Promise<void> => undefined,
	};

	return contextValue;
};

function TranslationProviderMock({ children }: PropsWithChildren<{}>): ReactElement {
	return <TranslationContext.Provider children={children} value={getContextValue()} />;
}

export function MeteorProviderMock({ children }: PropsWithChildren<{}>): ReactElement {
	return <ServerProvider>
		<TranslationProviderMock>
			{children}
		</TranslationProviderMock>
	</ServerProvider>;
}
