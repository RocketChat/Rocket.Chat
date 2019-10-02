import React, { useEffect, useState } from 'react';
import i18next from 'i18next';

import { TranslationContext } from '../contexts/TranslationContext';

export function TranslationProvider({ children }) {
	const [contextValue, setContextValue] = useState();

	useEffect(() => {
		const initializeI18next = async () => {
			await i18next.init({
				fallbackLng: 'en',
				defaultNS: 'project',
				resources: {
					en: {
						project: require('../../../packages/rocketchat-i18n/i18n/en.i18n.json'),
					},
				},
				interpolation: {
					prefix: '__',
					suffix: '__',
				},
			});
			setContextValue({
				translate: (key, ...replaces) => {
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
				},
				doKeyExists: (key) => i18next.exists(key),
			});
		};
		initializeI18next();
	}, []);

	if (!contextValue) {
		return <>{children}</>;
	}

	return <TranslationContext.Provider value={contextValue}>
		{children}
	</TranslationContext.Provider>;
}
