import { useContext } from 'react';

import { SettingsContext } from '../SettingsContext';

export const useSettingsCount = (): number => {
	const { countSettings } = useContext(SettingsContext);
	return countSettings();
};
