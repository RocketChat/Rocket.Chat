import { useSettings } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { RecordList } from '../../../lib/lists/RecordList';

export const useSettingSelectOptions = (filter = '') => {
	const settings = useSettings();

	const [itemsList, setItemsList] = useState(() => new RecordList());
	const reload = useCallback(() => setItemsList(new RecordList()), []);

	useEffect(() => {
		reload();
	}, [reload, filter]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			return {
				items: settings
					.map(({ _id }) => ({ label: _id, value: _id, _id }))
					.filter(({ label }) => label.toUpperCase().includes(filter.toUpperCase()))
					.slice(start, start + end),
				itemCount: settings.length,
			};
		},
		[filter, settings],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
		fetchData,
	};
};
