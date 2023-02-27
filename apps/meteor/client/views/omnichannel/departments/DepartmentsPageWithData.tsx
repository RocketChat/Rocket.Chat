import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import DepartmentItemMenu from './DepartmentItemMenu';
import DepartmentsTable from './DepartmentsTable';

const DepartmentsPageWithData = (): ReactElement => {
	const [text, setText] = useState('');
	const [debouncedText = ''] = useDebouncedValue(text, 500);
	const pagination = usePagination();
	const sort = useSort<'name' | 'email' | 'active'>('name');

	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const result = useQuery(
		['omnichannel', 'departments', debouncedText, pagination, sort],
		() =>
			getDepartments({
				onlyMyDepartments: 'true',
				text: debouncedText,
				sort: JSON.stringify({ [sort.sortBy]: sort.sortDirection === 'asc' ? 1 : -1 }),
				...(pagination.current && { offset: pagination.current }),
				...(pagination.itemsPerPage && { count: pagination.itemsPerPage }),
			}),
		{
			keepPreviousData: true,
		},
	);

	const removeButton = (dep: Omit<ILivechatDepartment, '_updatedAt'>) => <DepartmentItemMenu dep={dep} />;

	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			<DepartmentsTable
				aria-busy={text !== debouncedText}
				aria-live='assertive'
				data={result.data}
				sort={sort}
				pagination={pagination}
				removeButton={removeButton}
				loading={result.isLoading && result.isInitialLoading}
			></DepartmentsTable>
		</>
	);
};

export default DepartmentsPageWithData;
