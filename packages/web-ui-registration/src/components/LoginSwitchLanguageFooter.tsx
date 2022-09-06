import { useSetting, useLoadLanguage, useLanguage, useLanguages } from '@rocket.chat/ui-contexts';
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
	const currentLanguage = useLanguage();

	const languages = useLanguages();
	const loadLanguage = useLoadLanguage();

	const serverLanguage = normalizeLanguage((useSetting('Language') as string | undefined) || 'en');

	const suggestions = useMemo(() => {
		const potentialSuggestions = new Set([serverLanguage, browserLanguage, 'en'].map(normalizeLanguage));
		return Array.from(potentialSuggestions).filter(
			(language) => language && language !== currentLanguage && Boolean(languages.find(({ key }) => key === language)),
		);
	}, [serverLanguage, browserLanguage, currentLanguage]);

	const handleSwitchLanguageClick = (language: string) => (): void => {
		loadLanguage(language);
	};

	if (!suggestions.length) {
		return null;
	}

	return (
		<p className='switch-language' role='group'>
			<Trans i18nKey='registration.component.switchLanguage'>
				Switch to
				<>
					{suggestions.map((language, index) => {
						return (
							<Fragment key={language}>
								{index > 0 ? <span aria-hidden='true'> | </span> : <></>}
								<button onClick={handleSwitchLanguageClick(language)} className='js-switch-language'>
									{language}
								</button>
							</Fragment>
						);
					})}
				</>
			</Trans>
		</p>
	);
};

export default LoginSwitchLanguageFooter;
