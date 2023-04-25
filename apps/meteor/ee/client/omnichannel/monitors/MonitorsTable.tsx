import type { ILivechatMonitor } from '@rocket.chat/core-typings';
import { IconButton, Pagination } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { TableHTMLAttributes } from 'react';
import React, { useMemo } from 'react';

import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../../client/components/GenericTable';

type MonitorsTableProps = {
	data?: { monitors: ILivechatMonitor[]; count?: number; offset?: number; total: number };
	handleRemove: (username: string) => void;
	pagination: any;
	sort: any;
	loading: boolean;
} & TableHTMLAttributes<HTMLTableElement>;

function MonitorsTable({ data, handleRemove, pagination, sort, loading, ...props }: MonitorsTableProps) {
	const t = useTranslation();

	const { monitors } = data || {};
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = pagination;
	const { sortBy, sortDirection, setSort } = sort;

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort}>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort}>
				{t('Username')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='email' direction={sortDirection} active={sortBy === 'email'} onClick={setSort}>
				{t('Email')}
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
					{monitors && !loading ? (
						monitors.map((monitor: ILivechatMonitor) => (
							<GenericTableRow key={monitor._id} tabIndex={0} width='full'>
								<GenericTableCell withTruncatedText>{monitor.name}</GenericTableCell>
								<GenericTableCell withTruncatedText>{monitor.username}</GenericTableCell>
								<GenericTableCell withTruncatedText>{monitor.email}</GenericTableCell>
								<GenericTableCell withTruncatedText>
									<IconButton icon='trash' mini title={t('Remove')} onClick={() => handleRemove(monitor.username)} />
								</GenericTableCell>
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

export default MonitorsTable;
