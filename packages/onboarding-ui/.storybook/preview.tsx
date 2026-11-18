import { DarkModeProvider } from '@rocket.chat/layout';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { appRootDecorator, languageGlobalTypes, languageInitialGlobals } from '@rocket.chat/storybook-config/app-root';
import { parameters, decorators, useThemeMode } from '@rocket.chat/storybook-config/preview';
import type { Decorator, Preview } from '@storybook/react-webpack5';
import { I18nextProvider, useTranslation } from 'react-i18next';

import en from '../.i18n/en.i18n.json';

type NestedTranslations = { [key: string]: string | NestedTranslations };

const flatten = (translations: NestedTranslations, prefix = ''): Record<string, string> =>
	Object.fromEntries(
		Object.entries(translations).flatMap(([key, value]) =>
			typeof value === 'string' ? [[`${prefix}${key}`, value]] : Object.entries(flatten(value, `${prefix}${key}.`)),
		),
	);

/**
 * Resolves the package's unprefixed keys in the `onboarding` namespace, as the app does around its onboarding steps,
 * and darkens the layout with the theme.
 */
const OnboardingDecorator: Decorator = (Story, { globals }) => {
	const { i18n } = useTranslation();
	const dark = useThemeMode(globals.theme) === 'dark';

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			<DarkModeProvider.default forcedDarkMode={dark}>
				<Story />
			</DarkModeProvider.default>
		</I18nextProvider>
	);
};

const preview: Preview = {
	parameters: {
		...parameters,
	},
	decorators: [
		...decorators,
		OnboardingDecorator,
		// The package's own English strings stay the source; the app's catalog only carries the subset it renders.
		appRootDecorator(mockAppRoot, (root) => root.withTranslations('en', 'onboarding', flatten(en))),
	],
	globalTypes: languageGlobalTypes,
	initialGlobals: languageInitialGlobals,
	tags: ['autodocs'],
};

export default preview;
