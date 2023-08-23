import { Button } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { type TranslationLanguage, useSetting, useLoadLanguage, useLanguage, useLanguages } from '@rocket.chat/ui-contexts';
import { type ReactElement, type UIEvent, useMemo, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

const normalizeLanguage = (language: string): string => {
	// Fix browsers having all-lowercase language settings eg. pt-br, en-us
	const regex = /([a-z]{2,3})-([a-z]{2,4})/;
	const matches = regex.exec(language);
	if (matches) {
		return `${matches[1]}-${matches[2].toUpperCase()}`;
	}

	return language;
};

const useSuggestedLanguages = ({
	browserLanguage = normalizeLanguage(window.navigator.language ?? 'en'),
}: {
	browserLanguage?: string;
}) => {
	const availableLanguages = useLanguages();
	const currentLanguage = useLanguage();
	const serverLanguage = normalizeLanguage(useSetting<string>('Language') || 'en');

	const suggestions = useMemo(() => {
		const potentialLanguages = new Set([serverLanguage, browserLanguage, 'en'].map(normalizeLanguage));
		const potentialSuggestions = Array.from(potentialLanguages).map((potentialLanguageKey) =>
			availableLanguages.find((language) => language.key === potentialLanguageKey),
		);
		return potentialSuggestions.filter((language): language is TranslationLanguage => {
			return !!language && language.key !== currentLanguage;
		});
	}, [serverLanguage, browserLanguage, availableLanguages, currentLanguage]);

	const { i18n } = useTranslation();

	useEffect(() => {
		i18n.loadLanguages(suggestions.map((suggestion) => suggestion.key));
	}, [i18n, suggestions]);

	return { suggestions };
};

type LoginSwitchLanguageFooterProps = {
	browserLanguage?: string;
};

const LoginSwitchLanguageFooter = ({
	browserLanguage = normalizeLanguage(window.navigator.language ?? 'en'),
}: LoginSwitchLanguageFooterProps): ReactElement | null => {
	const loadLanguage = useLoadLanguage();
	const { suggestions } = useSuggestedLanguages({ browserLanguage });

	const [, setPreferedLanguage] = useLocalStorage('preferedLanguage', '');
	const handleSwitchLanguageClick =
		(language: TranslationLanguage) =>
		async (event: UIEvent): Promise<void> => {
			event.preventDefault();
			await loadLanguage(language.key);
			setPreferedLanguage(language.key);
		};

	if (!suggestions.length) {
		return null;
	}

	return (
		<HorizontalWizardLayoutCaption>
			{suggestions.map((suggestion) => (
				<Button secondary small mie={8} key={suggestion.key} onClick={handleSwitchLanguageClick(suggestion)}>
					<Trans i18nKey='registration.component.switchLanguage' tOptions={{ lng: suggestion.key }}>
						Change to <strong>{{ name: suggestion.ogName }}</strong>
					</Trans>
				</Button>
			))}
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginSwitchLanguageFooter;
