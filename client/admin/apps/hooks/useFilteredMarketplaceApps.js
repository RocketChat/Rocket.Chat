import { useMemo, useContext } from 'react';

import { AppDataContext } from '../AppProvider';

export const useFilteredMarketplaceApps = ({ text, sort, current, itemsPerPage }) => {
	const { data, dataCache } = useContext(AppDataContext);

	const filteredValues = useMemo(() => {
		if (data.length) {
			const dataCopy = data.slice(0);
			let filtered = sort[1] === 'asc' ? dataCopy : dataCopy.reverse();

			filtered = text ? filtered.filter((app) => app.name.toLowerCase().indexOf(text.toLowerCase()) > -1) : filtered;

			const filteredLength = filtered.length;

			const sliceStart = current > filteredLength ? 0 : current;

			filtered = filtered.slice(sliceStart, current + itemsPerPage);

			return [filtered, filteredLength];
		}
		return [null, 0];
	}, [text, sort, data, dataCache, current, itemsPerPage]);

	return [...filteredValues];
};
