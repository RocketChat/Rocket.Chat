import { useCallback, useState } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
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
};

type PaginatedOptionType = {
	_id: string;
	_updatedAt: Date;
	value: string | number;
	label: string;
};

export const useDepartmentsList = (
	options: DepartmentsListOptions,
): {
	itemsList: RecordList<PaginatedOptionType>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<PaginatedOptionType>());
	const reload = useCallback(() => setItemsList(new RecordList<PaginatedOptionType>()), []);
	const endpoint = 'livechat/department';

	const getDepartments = useEndpoint('GET', endpoint);

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
				enabled: options.enabled,
			});

			const items = departments
				.filter((department) => {
					if (options.departmentId && department._id === options.departmentId) {
						return false;
					}
					return true;
				})
				.map((department: any) => ({
					_updatedAt: new Date(department._updatedAt),
					label: department.name,
					value: department._id,
					_id: department._id,
				}));

			options.haveAll &&
				items.unshift({
					_id: 'all',
					label: t('All'),
					value: 'all',
					_updatedAt: new Date(),
				});

			options.haveNone &&
				items.unshift({
					_id: 'none',
					label: t('None'),
					value: '',
					_updatedAt: new Date(),
				});

			return {
				items,
				itemCount: options.departmentId ? total - 1 : total,
			};
		},
		[
			getDepartments,
			options.departmentId,
			options.filter,
			options.haveAll,
			options.onlyMyDepartments,
			options.haveNone,
			options.excludeDepartmentId,
			options.enabled,
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
