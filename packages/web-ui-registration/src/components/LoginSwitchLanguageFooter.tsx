import { Box } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useSetting, useLoadLanguage, useLanguage, useLanguages, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

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
		const potentialSuggestions = new Set([serverLanguage, browserLanguage, 'en'].map(normalizeLanguage));
		return Array.from(potentialSuggestions).filter((language) => {
			return language && language !== currentLanguage && Boolean(languages.find(({ key }) => key === language));
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

	return (
		<Box display='flex'>
			{t('Switch_to')}

			{suggestions.map((language, index) => (
				<Box key={language} mis={8} display='flex'>
					{index > 0 ? <Box mie={8}>|</Box> : null}
					<Box onClick={handleSwitchLanguageClick(language)}>{language}</Box>
				</Box>
			))}
		</Box>
	);
};

export default LoginSwitchLanguageFooter;
