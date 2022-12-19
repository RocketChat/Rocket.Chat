import { Pagination, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useCallback } from 'react';

import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState/AsyncStatePhase';
import SendTestButton from './SendTestButton';

const useQuery = (
	{
		itemsPerPage,
		current,
	}: {
		itemsPerPage: number;
		current: number;
	},
	[column, direction]: string[],
): {
	offset?: number;
	count?: number;
	sort: string;
} =>
	useMemo(
		() => ({
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage],
	);

const EmailInboxTable = (): ReactElement => {
	const t = useTranslation();
	const router = useRoute('admin-email-inboxes');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'email' | 'active'>('name');
	const query = useQuery({ itemsPerPage, current }, [sortBy, sortDirection]);

	const onClick = useCallback(
		(_id) => (): void => {
			router.push({
				context: 'edit',
				_id,
			});
		},
		[router],
	);

	const { phase, value: { emailInboxes = [], count = 0 } = {} } = useEndpointData('/v1/email-inbox.list', query);

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort}>
				{t('Name')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='email' direction={sortDirection} active={sortBy === 'email'} onClick={setSort}>
				{t('Email')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='active' direction={sortDirection} active={sortBy === 'active'} onClick={setSort}>
				{t('Active')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='action'>{t('Action')}</GenericTableHeaderCell>,
		],
		[setSort, sortBy, sortDirection, t],
	);

	return (
		<>
			{phase === AsyncStatePhase.LOADING && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={4} />}</GenericTableBody>
				</GenericTable>
			)}
			{emailInboxes && emailInboxes.length > 0 && phase === AsyncStatePhase.RESOLVED && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{emailInboxes.map((emailInbox) => (
								<GenericTableRow
									key={emailInbox._id}
									onKeyDown={onClick(emailInbox._id)}
									onClick={onClick(emailInbox._id)}
									tabIndex={0}
									role='link'
									action
									width='full'
								>
									<GenericTableCell withTruncatedText>{emailInbox.name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{emailInbox.email}</GenericTableCell>
									<GenericTableCell withTruncatedText>{emailInbox.active ? t('Yes') : t('No')}</GenericTableCell>
									<SendTestButton id={emailInbox._id} />
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						current={current}
						itemsPerPage={itemsPerPage}
						count={count}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{phase === AsyncStatePhase.RESOLVED && emailInboxes.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</>
	);
};

export default EmailInboxTable;
