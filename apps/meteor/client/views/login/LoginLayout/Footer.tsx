import { useSetting, useLoadLanguage, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';

import { filterLanguage } from '../../../lib/utils/filterLanguage';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Window {
	function setLanguage(language: string): void;
}

const Footer = (): ReactElement => {
	const t = useTranslation();
	const loadLanguage = useLoadLanguage();

	const serverLanguage = filterLanguage((useSetting('Language') as string | undefined) ?? 'en');

	const getSuggestedLanguage = useCallback(
		(loadedLanguage) => {
			if (serverLanguage !== loadedLanguage) {
				return serverLanguage;
			}

			if (serverLanguage !== 'en') {
				return 'en';
			}

			return undefined;
		},
		[serverLanguage],
	);

	const [currentLanguage, setCurrentLanguage] = useState(() => filterLanguage(Meteor._localStorage.getItem('userLanguage') ?? 'en'));

	useEffect(() => {
		loadLanguage(currentLanguage).then(() => {
			window?.setLanguage?.(currentLanguage);
		});
	}, [currentLanguage, loadLanguage]);

	const [suggestedLanguage, setSuggestedLanguage] = useState(() => {
		const currentLanguage = filterLanguage(Meteor._localStorage.getItem('userLanguage') ?? 'en');
		return getSuggestedLanguage(currentLanguage);
	});

	const handleSwitchLanguageClick = (): void => {
		const language = suggestedLanguage;

		if (!language) {
			return;
		}

		setCurrentLanguage(language);
		setSuggestedLanguage(getSuggestedLanguage(language));
	};

	return (
		<footer>
			{suggestedLanguage ? (
				<div className='switch-language' onClick={handleSwitchLanguageClick}>
					<button className='js-switch-language'>{t('Language_Version', { lng: suggestedLanguage })}</button>
				</div>
			) : null}
		</footer>
	);
};

export default Footer;
