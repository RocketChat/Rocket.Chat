import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import DepartmentItemMenu from './DepartmentItemMenu';
import DepartmentsTable from './DepartmentsTable';

const DepartmentsPageWithData = (): ReactElement => {
	const [text, setText] = useState('');

	const pagination = usePagination();
	const sort = useSort<'name' | 'email' | 'active'>('name');

	const query = useDebouncedValue(
		useMemo(() => {
			return {
				onlyMyDepartments: 'true' as const,
				text,
				sort: JSON.stringify({ [sort.sortBy]: sort.sortDirection === 'asc' ? 1 : -1 }),
				...(pagination.current && { offset: pagination.current }),
				...(pagination.itemsPerPage && { count: pagination.itemsPerPage }),
				fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
			};
		}, [pagination, sort.sortBy, sort.sortDirection, text]),
		500,
	);

	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const { data, isLoading } = useQuery(['omnichannel', 'departments', query], () => getDepartments(query));

	const removeButton = (dep: Omit<ILivechatDepartment, '_updatedAt'>) => <DepartmentItemMenu dep={dep} />;

	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			<DepartmentsTable data={data} sort={sort} pagination={pagination} removeButton={removeButton} loading={isLoading}></DepartmentsTable>
		</>
	);
};

export default DepartmentsPageWithData;
