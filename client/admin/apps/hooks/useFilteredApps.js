import { useMemo } from 'react';

export const useFilteredApps = ({
	filterFunction = (text) => {
		if (!text) { return () => true; }
		return (app) => app.name.toLowerCase().indexOf(text.toLowerCase()) > -1;
	},
	text,
	sort,
	current,
	itemsPerPage,
	data,
	dataCache,
}) => {
	const filteredValues = useMemo(() => {
		if (Array.isArray(data)) {
			const dataCopy = data.slice(0);
			let filtered = sort[1] === 'asc' ? dataCopy : dataCopy.reverse();

			filtered = filtered.filter(filterFunction(text));

			const filteredLength = filtered.length;

			const sliceStart = current > filteredLength ? 0 : current;

			filtered = filtered.slice(sliceStart, current + itemsPerPage);

			return [filtered, filteredLength];
		}
		return [null, 0];
	}, [text, sort[1], dataCache, current, itemsPerPage]);

	return [...filteredValues];
};
