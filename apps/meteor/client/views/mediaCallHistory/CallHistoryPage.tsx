import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useSort, Page, PageHeader, PageContent, usePagination, GenericTableLoadingTable } from '@rocket.chat/ui-client';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { MediaCallHistoryTable, isCallHistoryTableExternalContact } from '@rocket.chat/ui-voip';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CallHistoryPageFilters, { useCallHistoryPageFilters } from './CallHistoryPageFilters';
import CallHistoryRowExternalUser from './CallHistoryRowExternalUser';
import CallHistoryRowInternalUser from './CallHistoryRowInternalUser';

const getSort = (sortBy: 'contact' | 'type' | 'status' | 'timestamp', sortDirection: 'asc' | 'desc') => {
	switch (sortBy) {
		case 'type':
			return { direction: sortDirection === 'asc' ? 1 : -1 };
		case 'status':
			return { state: sortDirection === 'asc' ? 1 : -1 };
		case 'timestamp':
			return { ts: sortDirection === 'asc' ? 1 : -1 };
		// Fix sort by contact
		case 'contact':
		default:
			return { ts: -1 };
	}
};

const CallHistoryPage = () => {
	const { t } = useTranslation();
	const sortProps = useSort<'contact' | 'type' | 'status' | 'timestamp'>('timestamp', 'desc');

	const getCallHistory = useEndpoint('GET', '/v1/call-history.list');
	const { setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const router = useRouter();

	const filterProps = useCallHistoryPageFilters();

	const { searchText, type, states } = filterProps;

	const debouncedSearchText = useDebouncedValue(searchText, 400);

	const onClickRow = useCallback(
		(_id: string) => {
			router.navigate(`/call-history/details/${_id}`);
		},
		[router],
	);

	const { data, isPending, error } = useQuery({
		queryKey: ['call-history', 'list', sortProps.sortBy, sortProps.sortDirection, paginationProps.current, paginationProps.itemsPerPage],
		queryFn: () => {
			const sort = getSort(sortProps.sortBy, sortProps.sortDirection);
			console.log({ debouncedSearchText, type, states });
			return getCallHistory({
				count: paginationProps.itemsPerPage,
				offset: paginationProps.current,
				sort: JSON.stringify(sort),
			});
		},
	});

	console.log('data', data);

	const tableData = useMemo(() => {
		return data?.items.map((item) => {
			if (item.external) {
				return {
					_id: item._id,
					contact: { number: item.contactExtension },
					type: item.direction,
					status: item.state,
					timestamp: item.ts,
					duration: item.duration,
				};
			}
			return {
				_id: item._id,
				contact: { _id: item.contactId, username: 'gab', name: 'gab' },
				type: item.direction,
				status: item.state,
				timestamp: item.ts,
				duration: item.duration,
			};
		});
	}, [data]);
	if (isPending) {
		return (
			<PageContent>
				<GenericTableLoadingTable headerCells={5} />
			</PageContent>
		);
	}
	if (error) {
		return <PageContent>Error: {error.message}</PageContent>;
	}
	return (
		<Page>
			<PageHeader title={t('Call_history')} />
			<PageContent>
				<CallHistoryPageFilters {...filterProps} />
				<MediaCallHistoryTable sort={sortProps}>
					{tableData?.map((item) =>
						isCallHistoryTableExternalContact(item.contact) ? (
							<CallHistoryRowExternalUser key={item._id} {...item} contact={item.contact} onClick={onClickRow} />
						) : (
							<CallHistoryRowInternalUser key={item._id} {...item} contact={item.contact} onClick={onClickRow} />
						),
					)}
				</MediaCallHistoryTable>
				<Pagination divider count={data?.total || 0} onSetItemsPerPage={setItemsPerPage} onSetCurrent={setCurrent} {...paginationProps} />
			</PageContent>
		</Page>
	);
};

export default CallHistoryPage;
