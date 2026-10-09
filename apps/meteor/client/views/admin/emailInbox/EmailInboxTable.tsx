import { Pagination, States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
	usePaginatedQueryKey,
	useSort,
} from '@rocket.chat/ui-client';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';

import SendTestButton from './SendTestButton';
import GenericNoResults from '../../../components/GenericNoResults';

const EmailInboxTable = () => {
	const t = useTranslation();
	const router = useRoute('admin-email-inboxes');
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'email' | 'active'>('name');

	const onClick = useCallback(
		(_id: string) => (): void => {
			router.push({
				context: 'edit',
				_id,
			});
		},
		[router],
	);

	const endpoint = useEndpoint('GET', '/v1/email-inbox.list');

	const query = {
		sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
	};
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: (query) => ['email-list', query] as const,
	});

	const result = useQuery({
		queryKey,
		queryFn: () => endpoint(paginatedQuery),
	});

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
			{result.isPending && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{result.isSuccess && result.data.emailInboxes.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{result.data.emailInboxes.map((emailInbox) => (
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
					<Pagination divider {...paginationProps} />
				</>
			)}
			{result.isSuccess && result.data.emailInboxes.length === 0 && <GenericNoResults />}
			{result.isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => result.refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default EmailInboxTable;
