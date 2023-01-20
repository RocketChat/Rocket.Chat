import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import DepartmentItemMenu from './DepartmentItemMenu';
import DepartmentsTable from './DepartmentsTable';

type DepartmentsPageWithDataProps = {
	_id?: string;
};

const DepartmentsPageWithData = ({ _id }: DepartmentsPageWithDataProps): ReactElement => {
	const [text, setText] = useState('');

	const onlyMyDepartments = true;
	const departmentsRoute = useRoute('omnichannel-departments');

	const onRowClick = useMutableCallback(
		(id) => () =>
			departmentsRoute.push({
				context: 'edit',
				id,
			}),
	);

	const pagination = usePagination();
	const sort = useSort<'name' | 'email' | 'active'>('name');

	const query = useDebouncedValue(
		useMemo(() => {
			return {
				onlyMyDepartments: onlyMyDepartments ? 'true' : 'false',
				text,
				sort: JSON.stringify({ [sort.sortBy]: sort.sortDirection === 'asc' ? 1 : -1 }),
				...(pagination.current && { offset: pagination.current }),
				...(pagination.itemsPerPage && { count: pagination.itemsPerPage }),
				fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
			};
		}, [onlyMyDepartments, pagination, sort.sortBy, sort.sortDirection, text]),
		500,
	);

	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const { data, refetch, isLoading } = useQuery(['getDepartments', query], async () => getDepartments(query));

	const removeButton = (dep: ILivechatDepartment) => <DepartmentItemMenu dep={dep} reload={() => refetch()} />;

	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			<DepartmentsTable
				_id={_id}
				onRowClick={onRowClick}
				data={data}
				sort={sort}
				pagination={pagination}
				removeButton={removeButton}
				loading={isLoading}
			></DepartmentsTable>
		</>
	);
};

export default DepartmentsPageWithData;
