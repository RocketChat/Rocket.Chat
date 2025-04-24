import type { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';

type DepartmentsListOptions = {
	filter: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	excludeId?: string;
	enabled?: boolean;
	showArchived?: boolean;
	selectedDepartment?: string;
	limit?: number;
	unitId?: string;
};

export const useInfiniteDepartmentsList = (options: DepartmentsListOptions) => {
	const { t } = useTranslation();
	const getLivechatDepartments = useEndpoint('GET', '/v1/livechat/department');
	const getUnitDepartments = useEndpoint('GET', '/v1/livechat/units/:unitId/departments/available', { unitId: options.unitId || 'none' });
	const getDepartments = options.unitId !== undefined ? getUnitDepartments : getLivechatDepartments;

	const formatDepartmentItem = ({ _id, name, ...department }: Serialized<ILivechatDepartment>): DepartmentListItem => ({
		_id,
		label: department.archived ? `${name} [${t('Archived')}]` : name,
		value: _id,
	});

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/department', options],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { departments, ...data } = await getDepartments({
				onlyMyDepartments: `${!!options.onlyMyDepartments}`,
				text: options.filter,
				offset,
				count: options.limit ?? 50,
				sort: `{ "name": 1 }`,
				...(!options.unitId && {
					excludeDepartmentId: options.excludeId,
					enabled: options.enabled ? 'true' : 'false',
					showArchived: options.showArchived ? 'true' : 'false',
				}),
			});

			return {
				...data,
				departments: departments.map(formatDepartmentItem),
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
