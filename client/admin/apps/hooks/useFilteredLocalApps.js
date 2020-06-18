import { useMemo, useContext } from 'react';

import { AppDataContext } from '../AppProvider';
import { useFilteredApps } from './useFilteredApps';

export const useFilteredLocalApps = (params) => {
	const { data, dataCache } = useContext(AppDataContext);

	const localApps = useMemo(() => {
		if (!data.length) { return null; }
		return data.filter((current) => current.installed);
	}, [dataCache]);

	const filteredApps = useFilteredApps({ data: localApps, dataCache, ...params });

	return filteredApps;
};
