import { useContext } from 'react';

import { AppsContext } from '../../../contexts/AppsContext';

export const usePrivateAppsDisabled = () => {
	const { privateAppsDisabled } = useContext(AppsContext);

	return privateAppsDisabled;
};
