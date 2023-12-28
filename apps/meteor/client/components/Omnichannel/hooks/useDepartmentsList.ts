import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type DepartmentsListOptions = {
	filter: string;
	departmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	excludeDepartmentId?: string;
	enabled?: boolean;
	showArchived?: boolean;
};

type DepartmentListItem = {
	_id: string;
	label: string;
	value: string;
};

export const useDepartmentsList = (
	options: DepartmentsListOptions,
): {
	itemsList: RecordList<DepartmentListItem>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<DepartmentListItem>());
	const reload = useCallback(() => setItemsList(new RecordList<DepartmentListItem>()), []);

	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { departments, total } = await getDepartments({
				onlyMyDepartments: `${!!options.onlyMyDepartments}`,
				text: options.filter,
				offset: start,
				count: end + start,
				sort: `{ "name": 1 }`,
				excludeDepartmentId: options.excludeDepartmentId,
				enabled: options.enabled ? 'true' : 'false',
				showArchived: options.showArchived ? 'true' : 'false',
			});

			const items = departments
				.filter((department) => {
					if (options.departmentId && department._id === options.departmentId) {
						return false;
					}
					return true;
				})
				.map(({ _id, name, _updatedAt, ...department }): DepartmentListItem => {
					return {
						_id,
						label: department.archived ? `${name} [${t('Archived')}]` : name,
						value: _id,
					};
				});

			options.haveAll &&
				items.unshift({
					_id: '',
					label: t('All'),
					value: 'all',
				});

			options.haveNone &&
				items.unshift({
					_id: '',
					label: t('None'),
					value: '',
				});

			return {
				items,
				itemCount: options.departmentId ? total - 1 : total,
			};
		},
		[
			getDepartments,
			options.onlyMyDepartments,
			options.filter,
			options.excludeDepartmentId,
			options.enabled,
			options.showArchived,
			options.haveAll,
			options.haveNone,
			options.departmentId,
			t,
		],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
