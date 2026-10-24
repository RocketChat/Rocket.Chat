import { DarkModeProvider } from '@rocket.chat/layout';
import { parameters, decorators } from '@rocket.chat/storybook-config/preview';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';
import i18next from 'i18next';
import { Suspense } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

const getI18n = () => {
	const i18n = i18next.createInstance().use(initReactI18next);

	import('../.i18n/en.i18n.json').then((translation) => {
		i18n.init({
			fallbackLng: 'en',
			debug: false,
			resources: {
				en: {
					translation,
				},
			},
		});
	});

	return i18n;
};

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [
		...decorators,
		(Story) => {
			const dark = useDarkMode();

			return (
				<Suspense fallback={null}>
					<I18nextProvider i18n={getI18n()}>
						<DarkModeProvider.default forcedDarkMode={dark}>
							<Story />
						</DarkModeProvider.default>
					</I18nextProvider>
				</Suspense>
			);
		},
	],
	tags: ['autodocs'],
};

export default preview;
