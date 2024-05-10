import { useContext } from 'react';

import { AppsContext } from '../AppsContext';

export const useAppsReload = (): (() => void) => {
	const { reload } = useContext(AppsContext);
	return reload;
};
