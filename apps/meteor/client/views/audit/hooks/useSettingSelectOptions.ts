import { useSettings } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

type SettingSelectOption = {
	label: string;
	value: string;
	_id: string;
};

export const useSettingSelectOptions = (filter = '') => {
	const settings = useSettings();

	const fetchData = useCallback(
		async (start = 0): Promise<SettingSelectOption[]> => {
			return settings
				.map(({ _id }) => ({ label: _id, value: _id, _id }))
				.filter(({ label }) => label.toUpperCase().includes(filter.toUpperCase()))
				.slice(start, start + 50);
		},
		[filter, settings],
	);

	return useInfiniteQuery({
		queryKey: ['settings', filter],
		queryFn: ({ pageParam }) => fetchData(pageParam),
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			if (lastPage.length === 0) {
				return undefined;
			}
			return lastPageParam + 1;
		},
		getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
			if (firstPageParam <= 1) {
				return undefined;
			}
			return firstPageParam - 1;
		},
		initialPageParam: 0,
	});
};
