import { Box, Button } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import type { TranslationLanguage } from '@rocket.chat/ui-contexts';
import { useSetting, useLoadLanguage, useLanguage, useLanguages, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import { useMemo } from 'react';
import { Trans } from 'react-i18next';

export const normalizeLanguage = (language: string): string => {
	// Fix browsers having all-lowercase language settings eg. pt-br, en-us
	const regex = /([a-z]{2,3})-([a-z]{2,4})/;
	const matches = regex.exec(language);
	if (matches) {
		return `${matches[1]}-${matches[2].toUpperCase()}`;
	}

	return language;
};

const browserLanguage = normalizeLanguage(window.navigator.language ?? 'en');

const LoginSwitchLanguageFooter = (): ReactElement | null => {
	const currentLanguage = useLanguage();

	const languages = useLanguages();
	const loadLanguage = useLoadLanguage();

	const serverLanguage = normalizeLanguage((useSetting('Language') as string | undefined) || 'en');

	const suggestions = useMemo(() => {
		const potentialLanguages = new Set([serverLanguage, browserLanguage, 'en'].map(normalizeLanguage));
		const potentialSuggestions = Array.from(potentialLanguages).map((potentialLanguageKey) =>
			languages.find((language) => language.key === potentialLanguageKey),
		);
		return potentialSuggestions.filter((language): language is TranslationLanguage => {
			return !!language && language.key !== currentLanguage;
		});
	}, [serverLanguage, currentLanguage, languages]);

	const [, setUserLanguage] = useLocalStorage('userLanguage', '');
	const handleSwitchLanguageClick =
		(language: TranslationLanguage) =>
		async (event: UIEvent): Promise<void> => {
			event.preventDefault();
			await loadLanguage(language.key);
			setUserLanguage(language.key);
		};

	const router = useRouter();

	if (!suggestions.length) {
		return null;
	}

	return (
		<HorizontalWizardLayoutCaption>
			<Box withRichContent>
				{suggestions.map((suggestion) => (
					<Button
						secondary
						small
						mie={8}
						key={suggestion.key}
						href={router.buildRoutePath('/home')}
						role='button'
						onClick={handleSwitchLanguageClick(suggestion)}
					>
						<Trans i18nKey='registration.component.switchLanguage' lang={suggestion.key} tOptions={{ lng: suggestion.key }}>
							<Box fontScale='c1'>Change to {{ name: suggestion.name }}</Box>
						</Trans>
					</Button>
				))}
			</Box>
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginSwitchLanguageFooter;
