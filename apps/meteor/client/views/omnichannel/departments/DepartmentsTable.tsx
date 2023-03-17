import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, TableHTMLAttributes } from 'react';
import React, { useMemo } from 'react';

import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';

type DepartmentsTableProps = {
	data?: { departments: Omit<ILivechatDepartment, '_updatedAt'>[]; count?: number; offset?: number; total: number };
	removeButton: (department: Omit<ILivechatDepartment, '_updatedAt'>) => ReactElement;
	pagination: any;
	sort: any;
	loading: boolean;
} & TableHTMLAttributes<HTMLTableElement>;

function DepartmentsTable({ data, removeButton, pagination, sort, loading, ...props }: DepartmentsTableProps) {
	const t = useTranslation();

	const { departments } = data || {};
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = pagination;
	const { sortBy, sortDirection, setSort } = sort;

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort}>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='description' direction={sortDirection} active={sortBy === 'description'} onClick={setSort}>
				{t('Description')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='numAgents' direction={sortDirection} active={sortBy === 'numAgents'} onClick={setSort}>
				{t('Num_Agents')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='enabled' direction={sortDirection} active={sortBy === 'enabled'} onClick={setSort}>
				{t('Enabled')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='showOnRegistration' direction={sortDirection} active={sortBy === 'showOnRegistration'} onClick={setSort}>
				{t('Show_on_registration_page')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='spacer' w={40} />,
		],
		[setSort, sortBy, sortDirection, t],
	);

	return (
		<>
			<GenericTable {...props}>
				<GenericTableHeader>{headers}</GenericTableHeader>
				<GenericTableBody>
					{departments && !loading ? (
						departments.map((department: Omit<ILivechatDepartment, '_updatedAt'>) => (
							<GenericTableRow key={department._id} tabIndex={0} width='full'>
								<GenericTableCell withTruncatedText>{department.name}</GenericTableCell>
								<GenericTableCell withTruncatedText>{department.description}</GenericTableCell>
								<GenericTableCell withTruncatedText>{department.numAgents || '0'}</GenericTableCell>
								<GenericTableCell withTruncatedText>{department.enabled ? t('Yes') : t('No')}</GenericTableCell>
								<GenericTableCell withTruncatedText>{department.showOnRegistration ? t('Yes') : t('No')}</GenericTableCell>
								<GenericTableCell withTruncatedText>{removeButton(department)}</GenericTableCell>
							</GenericTableRow>
						))
					) : (
						<GenericTableLoadingTable headerCells={6} />
					)}
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
	);
}

export default DepartmentsTable;
