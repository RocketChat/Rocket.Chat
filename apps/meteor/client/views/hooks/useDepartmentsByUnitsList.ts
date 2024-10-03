import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../hooks/useComponentDidUpdate';
import { RecordList } from '../../lib/lists/RecordList';

type DepartmentsListOptions = {
	unitId?: IOmnichannelBusinessUnit['_id'];
	filter: string;
};

export const useDepartmentsByUnitsList = (
	options: DepartmentsListOptions,
): {
	itemsList: RecordList<ILivechatDepartment>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatDepartment>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatDepartment>()), []);

	const getDepartments = useEndpoint('GET', '/v1/livechat/units/:unitId/departments/available', { unitId: options.unitId || 'none' });

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { departments, total } = await getDepartments({
				text: options.filter,
				offset: start,
				count: end + start,
			});

			return {
				items: departments.map(({ _id, name, _updatedAt, ...department }) => {
					return {
						...department,
						_id,
						name: department.archived ? `${name} [${t('Archived')}]` : name,
						label: name,
						value: _id,
					};
				}),
				itemCount: total,
			};
		},
		[getDepartments, options.filter, t],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
