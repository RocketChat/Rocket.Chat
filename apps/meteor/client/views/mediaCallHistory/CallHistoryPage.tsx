import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useSort, Page, PageHeader, PageContent, usePagination, GenericTableLoadingRow } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { MediaCallHistoryTable, isCallHistoryTableExternalContact } from '@rocket.chat/ui-voip';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallHistoryPageFilters, { useCallHistoryPageFilters } from './CallHistoryPageFilters';
import CallHistoryRowExternalUser from './CallHistoryRowExternalUser';
import CallHistoryRowInternalUser from './CallHistoryRowInternalUser';
import MediaCallHistoryContextualbar from './MediaCallHistoryContextualbar';
import UserInfoWithData from '../room/contextualBar/UserInfo/UserInfoWithData';

const getSort = (sortBy: 'contact' | 'type' | 'status' | 'timestamp', sortDirection: 'asc' | 'desc') => {
	const sortDirectionValue = sortDirection === 'asc' ? 1 : -1;
	switch (sortBy) {
		case 'type':
			return { direction: sortDirectionValue, ts: -1 };
		case 'status':
			return { state: sortDirectionValue, ts: -1 };
		case 'timestamp':
			return { ts: sortDirectionValue };
		// Fix sort by contact
		case 'contact':
			return { contactName: sortDirectionValue, contactUsername: sortDirectionValue, contactExtension: sortDirectionValue, ts: -1 };
		default:
			return { ts: -1 };
	}
};

const getStateFilter = <T extends string[]>(states: T): T | [...T, 'error'] | undefined => {
	if (states.length === 0) {
		return undefined;
	}
	if (states.includes('failed')) {
		return [...states, 'error'];
	}
	return states;
};

type DetailsTab = {
	openTab: 'details';
	rid: string;
};

type UserInfoTab = {
	openTab: 'user-info';
	rid: string;
	userId: string;
};

type Tab = DetailsTab | UserInfoTab;

const CallHistoryPage = () => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<Tab | null>(null);
	const sortProps = useSort<'contact' | 'type' | 'status' | 'timestamp'>('timestamp', 'desc');

	const getCallHistory = useEndpoint('GET', '/v1/call-history.list');
	const { setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const router = useRouter();
	const historyId = useRouteParameter('historyId');

	const filterProps = useCallHistoryPageFilters();

	const { searchText, type, states } = filterProps;

	const debouncedSearchText = useDebouncedValue(searchText, 400);

	const onClickRow = useCallback(
		(rid: string, _id: string) => {
			router.navigate(`/call-history/details/${_id}`);
			setTab({ openTab: 'details', rid });
		},
		[router],
	);

	const openUserInfo = useCallback(
		(rid: string, userId: string) => {
			setTab({ openTab: 'user-info', rid, userId });
		},
		[setTab],
	);

	const closeTab = useCallback(() => {
		setTab(null);
		router.navigate('/call-history');
	}, [router]);

	const handleBack = useCallback(() => {
		if (historyId && tab?.rid) {
			onClickRow(tab.rid, historyId);
			return;
		}
		setTab(null);
	}, [setTab, historyId, onClickRow, tab?.rid]);

	const { data, isPending, error } = useQuery({
		queryKey: [
			'call-history',
			'list',
			sortProps.sortBy,
			sortProps.sortDirection,
			paginationProps.current,
			paginationProps.itemsPerPage,
			type,
			states,
		],
		queryFn: () => {
			const sort = getSort(sortProps.sortBy, sortProps.sortDirection);
			const stateFilter = getStateFilter(states);
			console.log({ debouncedSearchText, type, states });
			return getCallHistory({
				count: paginationProps.itemsPerPage,
				offset: paginationProps.current,
				sort: JSON.stringify(sort),
				...(type !== 'all' && { direction: type }),
				...(stateFilter && { state: stateFilter }),
			});
		},
	});

	const tableData = useMemo(() => {
		return data?.items.map((item) => {
			if (item.external) {
				return {
					_id: item._id,
					contact: { number: item.contactExtension || t('Unknown') },
					type: item.direction,
					status: item.state,
					timestamp: item.ts,
					duration: item.duration,
				};
			}
			if (!item.contactUsername || !item.contactName) {
				return {
					_id: item._id,
					contact: undefined,
					type: item.direction,
					status: item.state,
					timestamp: item.ts,
					duration: item.duration,
				};
			}
			return {
				_id: item._id,
				rid: item.rid,
				contact: { _id: item.contactId, username: item.contactUsername, name: item.contactName },
				messageId: item.messageId,
				type: item.direction,
				status: item.state,
				timestamp: item.ts,
				duration: item.duration,
			};
		});
	}, [data, t]);

	if (isPending) {
		return (
			<PageContent>
				<MediaCallHistoryTable sort={sortProps}>
					<GenericTableLoadingRow cols={5} />
				</MediaCallHistoryTable>
			</PageContent>
		);
	}

	if (error) {
		return <PageContent>Error: {error.message}</PageContent>;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Call_history')} />
				<PageContent>
					<CallHistoryPageFilters {...filterProps} />
					<MediaCallHistoryTable sort={sortProps}>
						{tableData?.map((item) =>
							!item.contact || isCallHistoryTableExternalContact(item.contact) ? (
								<CallHistoryRowExternalUser key={item._id} {...item} contact={item.contact} onClick={() => onClickRow('', item._id)} />
							) : (
								<CallHistoryRowInternalUser
									key={item._id}
									{...item}
									contact={item.contact}
									onClick={() => onClickRow(item.rid ?? '', item._id)}
									rid={item.rid ?? ''}
									onClickUserInfo={item.rid ? openUserInfo : undefined}
								/>
							),
						)}
					</MediaCallHistoryTable>
					<Pagination divider count={data?.total || 0} onSetItemsPerPage={setItemsPerPage} onSetCurrent={setCurrent} {...paginationProps} />
				</PageContent>
			</Page>
			{tab?.openTab === 'user-info' && (
				<UserInfoWithData rid={tab.rid} uid={tab.userId} onClose={closeTab} onClickBack={historyId ? handleBack : undefined} />
			)}
			{tab?.openTab === 'details' && historyId && (
				<MediaCallHistoryContextualbar
					historyId={historyId}
					onClose={closeTab}
					messageRoomId={tab.rid}
					openUserInfo={tab.rid ? (userId: string) => openUserInfo(tab.rid, userId) : undefined}
				/>
			)}
		</Page>
	);
};

export default CallHistoryPage;
