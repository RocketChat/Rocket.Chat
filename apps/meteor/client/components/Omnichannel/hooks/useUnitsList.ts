import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type UnitsListOptions = {
	text: string;
	haveNone?: boolean;
};

export type UnitOption = { value: string; label: string; _id: string };

export const useUnitsList = (
	options: UnitsListOptions,
): {
	itemsList: RecordList<UnitOption>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const { t } = useTranslation();
	const { haveNone = false } = options;
	const [itemsList, setItemsList] = useState(() => new RecordList<UnitOption>());
	const reload = useCallback(() => setItemsList(new RecordList<UnitOption>()), []);

	const getUnits = useEndpoint('GET', '/v1/livechat/units');
	const { text } = options;

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { units, total } = await getUnits({
				...(text && { text }),
				offset: start,
				count: end + start,
				sort: `{ "name": 1 }`,
			});

			const items = units.map<UnitOption>((u) => ({
				_id: u._id,
				label: u.name,
				value: u._id,
			}));

			haveNone &&
				items.unshift({
					_id: '',
					label: t('None'),
					value: '',
				});

			return {
				items,
				itemCount: haveNone ? total + 1 : total,
			};
		},
		[getUnits, haveNone, t, text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
