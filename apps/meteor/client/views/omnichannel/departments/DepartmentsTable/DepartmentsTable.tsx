import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import DepartmentItemMenu from './DepartmentItemMenu';

const DEPARTMENTS_ENDPOINTS = {
	department: '/v1/livechat/department',
	archived: '/v1/livechat/departments/archived',
} as const;

const DepartmentsTable = ({ archived }: { archived: boolean }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const router = useRouter();
	const debouncedText = useDebouncedValue(text, 500);

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description' | 'numAgents' | 'enabled' | 'showOnRegistration'>('name');

	const getDepartments = useEndpoint('GET', archived ? DEPARTMENTS_ENDPOINTS.archived : DEPARTMENTS_ENDPOINTS.department);

	const handleAddNew = useMutableCallback(() => router.navigate('/omnichannel/departments/new'));

	const query = useMemo(
		() => ({
			onlyMyDepartments: 'true' as const,
			text: debouncedText,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(current && { offset: current }),
			...(itemsPerPage && { count: itemsPerPage }),
		}),
		[current, itemsPerPage, sortBy, sortDirection, debouncedText],
	);

	const { data, isSuccess, isLoading } = useQuery(['livechat-departments', query, archived], async () => getDepartments(query), {
		keepPreviousData: true,
	});

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='description'
				direction={sortDirection}
				active={sortBy === 'description'}
				onClick={setSort}
				sort='description'
			>
				{t('Description')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='numAgents' direction={sortDirection} active={sortBy === 'numAgents'} onClick={setSort} sort='numAgents'>
				{t('Num_Agents')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='enabled' direction={sortDirection} active={sortBy === 'enabled'} onClick={setSort} sort='enabled'>
				{t('Enabled')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='showOnRegistration'
				direction={sortDirection}
				active={sortBy === 'showOnRegistration'}
				onClick={setSort}
				sort='showOnRegistration'
			>
				{t('Show_on_registration_page')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='spacer' w={40} />
		</>
	);

	return (
		<>
			{((isSuccess && data?.departments.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }): void => setText(text)} />}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={6} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.departments.length === 0 && (queryHasChanged || archived) && <GenericNoResults />}
			{isSuccess && data?.departments.length === 0 && !queryHasChanged && !archived && (
				<GenericNoResults
					icon='folder'
					title={t('No_departments_yet')}
					description={t('No_departments_yet_description')}
					buttonAction={handleAddNew}
					buttonTitle={t('Create_department')}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_departments')}
				/>
			)}
			{isSuccess && data?.departments.length > 0 && (
				<>
					<GenericTable aria-busy={text !== debouncedText} aria-live='assertive'>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.departments.map((department: Omit<ILivechatDepartment, '_updatedAt'>) => (
								<GenericTableRow key={department._id} tabIndex={0} width='full'>
									<GenericTableCell withTruncatedText>{department.name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{department.description}</GenericTableCell>
									<GenericTableCell withTruncatedText>{department.numAgents || '0'}</GenericTableCell>
									<GenericTableCell withTruncatedText>{department.enabled ? t('Yes') : t('No')}</GenericTableCell>
									<GenericTableCell withTruncatedText>{department.showOnRegistration ? t('Yes') : t('No')}</GenericTableCell>
									<GenericTableCell withTruncatedText>
										<DepartmentItemMenu department={department} archived={archived} />
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default DepartmentsTable;
