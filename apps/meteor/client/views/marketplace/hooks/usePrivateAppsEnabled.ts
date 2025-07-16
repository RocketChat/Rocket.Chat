import { useContext } from 'react';

import { AppsContext } from '../../../contexts/AppsContext';

export const usePrivateAppsEnabled = () => {
	const { privateAppsEnabled } = useContext(AppsContext);

	return privateAppsEnabled;
};
