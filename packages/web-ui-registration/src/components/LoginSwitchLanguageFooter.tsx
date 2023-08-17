import { Box, Button } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey, TranslationLanguage } from '@rocket.chat/ui-contexts';
import { useSetting, useLoadLanguage, useLanguage, useLanguages, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Fragment, useMemo } from 'react';
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
	const t = useTranslation();
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
	const handleSwitchLanguageClick = (language: string) => async (): Promise<void> => {
		await loadLanguage(language);
		setUserLanguage(language);
	};

	if (!suggestions.length) {
		return null;
	}

	console.log(languages);

	return (
		<>
			{suggestions.map(({ name }) => (
				<Box key={name}>
					<Trans i18nKey='registration.component.switchLanguage'>
						Switch to
						<Button onClick={handleSwitchLanguageClick(name)}>{t(name as TranslationKey)}</Button>
					</Trans>
				</Box>
			))}
		</>
	);
};

export default LoginSwitchLanguageFooter;
