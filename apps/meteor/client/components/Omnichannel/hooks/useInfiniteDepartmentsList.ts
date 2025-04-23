import type { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';

type DepartmentsListOptions = {
	filter: string;
	departmentId?: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	excludeDepartmentId?: string;
	enabled?: boolean;
	showArchived?: boolean;
	selectedDepartment?: string;
	limit?: number;
};

export const useInfiniteDepartmentsList = (options: DepartmentsListOptions) => {
	const { t } = useTranslation();
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const formatDepartmentItem = ({ _id, name, ...department }: Serialized<ILivechatDepartment>): DepartmentListItem => ({
		_id,
		label: department.archived ? `${name} [${t('Archived')}]` : name,
		value: _id,
	});

	return useInfiniteQuery({
		queryKey: [
			'/v1/livechat/department',
			options.onlyMyDepartments,
			options.filter,
			options.limit,
			options.excludeDepartmentId,
			options.enabled,
			options.showArchived,
		],
		queryFn: async ({ pageParam }) => {
			const start = pageParam ?? 0;

			const { departments, ...data } = await getDepartments({
				onlyMyDepartments: `${!!options.onlyMyDepartments}`,
				text: options.filter,
				offset: start,
				count: options.limit ?? 25,
				sort: `{ "name": 1 }`,
				excludeDepartmentId: options.excludeDepartmentId,
				enabled: options.enabled ? 'true' : 'false',
				showArchived: options.showArchived ? 'true' : 'false',
			});

			return {
				...data,
				departments: departments.map(formatDepartmentItem).filter((department) => {
					return department._id !== options.departmentId;
				}),
			};
		},
		select: (data) => {
			const items = data.pages.flatMap<DepartmentListItem>((page) => page.departments);

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

			return items;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
	});
};
