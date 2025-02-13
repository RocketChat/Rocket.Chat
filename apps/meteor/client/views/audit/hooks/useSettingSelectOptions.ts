import { useSettings, useSettingsCount } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { RecordList } from '../../../lib/lists/RecordList';

export const useSettingSelectOptions = (filter = '') => {
	const [skip, setSkip] = useState(0);
	const [limit, setLimit] = useState(25);
	const query = useMemo(
		() => ({
			...(filter && { _id: new RegExp(filter, 'i') }),
			skip,
			limit,
		}),
		[filter, limit, skip],
	);

	const settings = useSettings(query);
	const totalSettings = useSettingsCount();

	const [itemsList, setItemsList] = useState(() => new RecordList());
	const reload = useCallback(() => setItemsList(new RecordList()), []);

	useEffect(() => {
		reload();
	}, [reload, filter]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			setSkip(start);
			setLimit(start + end);

			return {
				items: settings.map(({ _id }) => ({ label: _id, value: _id, _id })),
				itemCount: totalSettings,
			};
		},
		[settings, totalSettings],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
