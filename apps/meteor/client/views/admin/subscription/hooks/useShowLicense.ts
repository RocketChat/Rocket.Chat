import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';
import tinykeys from 'tinykeys';

/** Whether the hidden license tab is shown, toggled by typing the Konami code anywhere on the page. */
export const useShowLicense = () => {
	const [showLicenseTab, setShowLicenseTab] = useSessionStorage('admin:showLicenseTab', false);

	useEffect(
		() =>
			tinykeys(window, {
				'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a': () => {
					setShowLicenseTab((showLicenseTab) => !showLicenseTab);
				},
			}),
		[setShowLicenseTab],
	);

	return showLicenseTab;
};
