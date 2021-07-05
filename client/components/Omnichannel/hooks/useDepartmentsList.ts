import { useCallback, useState } from 'react';

import { ILivechatDepartmentRecord } from '../../../../definition/ILivechatDepartmentRecord';
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
};

export const useDepartmentsList = (
	options: DepartmentsListOptions,
): {
	itemsList: RecordList<ILivechatDepartmentRecord>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const t = useTranslation();
	const [itemsList, setItemsList] = useState(() => new RecordList<ILivechatDepartmentRecord>());
	const reload = useCallback(() => setItemsList(new RecordList<ILivechatDepartmentRecord>()), []);
	const endpoint = 'livechat/department' as 'livechat/department';

	const getDepartments = useEndpoint('GET', endpoint);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { departments, total } = await getDepartments({
				onlyMyDepartments: options.onlyMyDepartments,
				text: options.filter,
				offset: start,
				count: end + start,
				sort: JSON.stringify({ name: 1 }),
			});

			const items = departments
				.filter((department) => {
					if (options.departmentId && department._id === options.departmentId) {
						return false;
					}
					return true;
				})
				.map((department: any) => {
					department._updatedAt = new Date(department._updatedAt);
					department.label = department.name;
					department.value = { value: department._id, label: department.name };
					return department;
				});

			options.haveAll &&
				items.unshift({
					label: t('All'),
					value: { value: 'all', label: t('All') },
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
