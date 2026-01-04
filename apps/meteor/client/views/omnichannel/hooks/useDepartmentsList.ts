import type { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { DepartmentListItem } from '../types/DepartmentsDefinitions';

type DepartmentsListOptions = {
	filter: string;
	onlyMyDepartments?: boolean;
	haveAll?: boolean;
	haveNone?: boolean;
	excludeId?: string;
	enabled?: boolean;
	showArchived?: boolean;
	selectedDepartmentId?: string;
	limit?: number;
	unitId?: string;
};

const DEFAULT_QUERY_LIMIT = 50;

export const useDepartmentsList = (options: DepartmentsListOptions) => {
	const { t } = useTranslation();
	const { enabled, filter, unitId, showArchived, excludeId, onlyMyDepartments, limit = DEFAULT_QUERY_LIMIT } = options;

	const getLivechatDepartments = useEndpoint('GET', '/v1/livechat/department');
	const getUnitDepartments = useEndpoint('GET', '/v1/livechat/units/:unitId/departments/available', { unitId: options.unitId || 'none' });
	const getDepartments = options.unitId !== undefined ? getUnitDepartments : getLivechatDepartments;
	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: options.selectedDepartmentId ?? '' });

	const formatDepartmentItem = ({ _id, name, ...department }: Serialized<ILivechatDepartment>): DepartmentListItem => ({
		_id,
		label: department.archived ? `${name} [${t('Archived')}]` : name,
		value: _id,
	});

	const selectedQueryResult = useQuery({
		queryKey: ['/v1/livechat/department/:_id', options.selectedDepartmentId],
		queryFn: async () => getDepartment({}),
		select: (data) => formatDepartmentItem(data.department),
		enabled: options.selectedDepartmentId !== undefined,
	});

	const listQueryResult = useInfiniteQuery({
		queryKey: ['/v1/livechat/department', options],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { departments, ...data } = await getDepartments({
				onlyMyDepartments: `${!!onlyMyDepartments}`,
				text: filter,
				offset,
				count: limit,
				sort: `{ "name": 1 }`,
				...(!unitId && {
					excludeDepartmentId: excludeId,
					enabled: enabled ? 'true' : 'false',
					showArchived: showArchived ? 'true' : 'false',
				}),
			});

			return {
				...data,
				departments: departments.map(formatDepartmentItem).filter((item) => item._id !== options.selectedDepartmentId),
			};
		},
		select: (data) => {
			const items = data.pages.flatMap<DepartmentListItem>((page) => page.departments);

			if (options.haveAll) {
				items.unshift({
					_id: '',
					label: t('All'),
					value: 'all',
				});
			}

			if (options.haveNone) {
				items.unshift({
					_id: '',
					label: t('None'),
					value: '',
				});
			}

			return items;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ departments: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});

	const data = useMemo(() => {
		if (selectedQueryResult.data) {
			return [...listQueryResult.data, selectedQueryResult.data];
		}

		return listQueryResult.data;
	}, [selectedQueryResult.data, listQueryResult.data]);

	return {
		...listQueryResult,
		data,
	};
};
