import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';
import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';
import { normalizeDepartments } from '../utils/normalizeDepartments';

export type DepartmentsListOptions = {
	filter: string;
	departmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	excludeDepartmentId?: string;
	enabled?: boolean;
	showArchived?: boolean;
	selectedDepartment?: string;
	onChange?: (value: string) => void;
};

export const useDepartmentsList = (
	options: DepartmentsListOptions,
): {
	itemsList: RecordList<DepartmentListItem>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const [itemsList, setItemsList] = useState(() => new RecordList<DepartmentListItem>());
	const reload = useCallback(() => setItemsList(new RecordList<DepartmentListItem>()), []);

	const getDepartments = useEndpoint('GET', '/v1/livechat/department');
	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: options.selectedDepartment ?? '' });

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
				.map(
					({ _id, name, ...department }): DepartmentListItem => ({
						_id,
						label: department.archived ? `${name} [${t('Archived')}]` : name,
						value: _id,
					}),
				);

			const normalizedItems = await normalizeDepartments({
				departments: items,
				options,
				getDepartment,
				dispatchToastMessage,
				t,
				queryClient,
			});

			return {
				items: normalizedItems,
				itemCount: options.departmentId ? total - 1 : total,
			};
		},
		[dispatchToastMessage, getDepartment, getDepartments, options, queryClient, t],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
