import { useContext } from 'react';

import { useFilteredApps } from './useFilteredApps';
import { AppDataContext } from '../AppProvider';

export const useFilteredMarketplaceApps = (params) => {
	const { data, dataCache } = useContext(AppDataContext);

	const filteredApps = useFilteredApps({ data, dataCache, ...params });

	return filteredApps;
};
