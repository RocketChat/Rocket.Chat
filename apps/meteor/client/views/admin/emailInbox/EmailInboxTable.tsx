import { Box, Pagination } from '@rocket.chat/fuselage';
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
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
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
) =>
	useMemo(
		() => ({
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage],
	);

const EmailInboxTable = () => {
	const t = useTranslation();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');
	const query = useQuery({ itemsPerPage, current }, [sortBy, sortDirection]);

	const router = useRoute('admin-email-inboxes');

	const onClick = useCallback(
		(_id) => () =>
			router.push({
				context: 'edit',
				_id,
			}),
		[router],
	);

	const { ...result } = useEndpointData('email-inbox.list', query);

	return (
		<>
			<GenericTable>
				<GenericTableHeader>
					<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
						{t('Name')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='email' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
						{t('Email')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell key='active' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name' w='x200'>
						{t('Active')}
					</GenericTableHeaderCell>
					<GenericTableHeaderCell
						key='sendTest'
						direction={sortDirection}
						active={sortBy === 'name'}
						onClick={setSort}
						sort='name'
						w='x200'
					></GenericTableHeaderCell>
				</GenericTableHeader>
				<GenericTableBody>
					{result.phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={2} />}
					{result.phase === AsyncStatePhase.RESOLVED &&
						result.value &&
						result.value.count > 0 &&
						result.value.emailInboxes.map((emailInbox) => (
							<GenericTableRow
								key={emailInbox._id}
								onKeyDown={onClick(emailInbox._id)}
								onClick={onClick(emailInbox._id)}
								tabIndex={0}
								role='link'
								action
								width='full'
							>
								<GenericTableCell fontScale='p1' color='default'>
									<Box withTruncatedText>{emailInbox.name}</Box>
								</GenericTableCell>
								<GenericTableCell fontScale='p1' color='default'>
									<Box withTruncatedText>{emailInbox.email}</Box>
								</GenericTableCell>
								<GenericTableCell fontScale='p1' color='default'>
									<Box withTruncatedText>{emailInbox.active ? t('Yes') : t('No')}</Box>
								</GenericTableCell>
								<SendTestButton id={emailInbox._id} />
							</GenericTableRow>
						))}
				</GenericTableBody>
			</GenericTable>
			{result.phase === AsyncStatePhase.RESOLVED && (
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					count={result.value.count || 0}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
					{...paginationProps}
				/>
			)}
		</>
	);
};

export default EmailInboxTable;
