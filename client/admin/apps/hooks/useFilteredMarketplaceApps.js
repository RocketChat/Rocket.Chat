import { useContext, useCallback } from 'react';

import { useFilteredApps } from './useFilteredApps';
import { AppDataContext } from '../AppProvider';

export const useFilteredMarketplaceApps = (params) => {
	const { data, dataCache } = useContext(AppDataContext);

	const filterFunction = useCallback((text) => ({ name, marketplace }) => marketplace !== false && name.toLowerCase().indexOf(text.toLowerCase()) > -1, [params.text]);

	const filteredApps = useFilteredApps({ data, dataCache, filterFunction, ...params });

	return filteredApps;
};
