import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Pagination, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
	usePaginatedQuery,
	usePagination,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { hashKey, keepPreviousData } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

import DepartmentItemMenu from './DepartmentItemMenu';
import FilterByText from '../../../../components/FilterByText';
import { links } from '../../../../lib/links';

const DEPARTMENTS_ENDPOINTS = {
	department: '/v1/livechat/department',
	archived: '/v1/livechat/departments/archived',
} as const;

export type DepartmentsTableProps = { archived: boolean };

const DepartmentsTable = ({ archived }: DepartmentsTableProps) => {
	const t = useTranslation();
	const router = useRouter();
	const [text, setText] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description' | 'numAgents' | 'enabled' | 'showOnRegistration'>('name');

	const getDepartments = useEndpoint('GET', archived ? DEPARTMENTS_ENDPOINTS.archived : DEPARTMENTS_ENDPOINTS.department);

	const handleAddNew = useStableCallback(() => router.navigate('/omnichannel/departments/new'));

	const query = useDebouncedValue(
		useMemo(
			() => ({
				onlyMyDepartments: 'true' as const,
				text,
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			}),
			[sortBy, sortDirection, text],
		),
		500,
	);

	const queryKey = ['livechat-departments', query, archived];
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ resetKey: queryKey });

	const { data, isSuccess, isLoading } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getDepartments,
		itemsKey: 'departments',
		offset: current,
		count: itemsPerPage,
		placeholderData: keepPreviousData,
	});

	const [defaultQuery] = useState(hashKey([query, current, itemsPerPage]));
	const queryHasChanged = defaultQuery !== hashKey([query, current, itemsPerPage]);

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'auto', 'auto', 40];

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
			<GenericTableHeaderCell key='spacer' />
		</>
	);

	return (
		<>
			{((isSuccess && data?.departments.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable columns={columns}>
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
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_departments')}
				/>
			)}
			{isSuccess && data?.departments.length > 0 && (
				<>
					<GenericTable columns={columns} aria-label={t('Departments')} aria-busy={isLoading} aria-live='polite'>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.departments.map((department: Omit<ILivechatDepartment, '_updatedAt'>) => (
								<GenericTableRow key={department._id} tabIndex={0}>
									<GenericTableCell truncate>{department.name}</GenericTableCell>
									<GenericTableCell truncate>{department.description}</GenericTableCell>
									<GenericTableCell truncate>{department.numAgents || '0'}</GenericTableCell>
									<GenericTableCell truncate>{department.enabled ? t('Yes') : t('No')}</GenericTableCell>
									<GenericTableCell truncate>{department.showOnRegistration ? t('Yes') : t('No')}</GenericTableCell>
									<GenericTableCell truncate>
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
