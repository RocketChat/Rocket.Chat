import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useSort, usePagination, GenericTableLoadingRow } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { MediaCallHistoryTable, isCallHistoryUnknownContact, isCallHistoryTableInternalContact } from '@rocket.chat/ui-voip';
import type { CallHistoryTableInternalContact, CallHistoryUnknownContact, CallHistoryTableExternalContact } from '@rocket.chat/ui-voip';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCallHistoryPageFilters } from './CallHistoryPageFilters';
import CallHistoryPageLayout from './CallHistoryPageLayout';
import CallHistoryRowExternalUser from './CallHistoryRowExternalUser';
import CallHistoryRowInternalUser from './CallHistoryRowInternalUser';
import CallHistoryRowUnknownUser from './CallHistoryRowUnknownUser';
import MediaCallHistoryContextualbar from './MediaCallHistoryContextualbar';
import GenericNoResults from '../../components/GenericNoResults';
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
		(userId: string, rid: string) => {
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

	const { data, isPending, isFetching, error, refetch, ...result } = useQuery({
		queryKey: [
			'call-history',
			'list',
			sortProps.sortBy,
			sortProps.sortDirection,
			paginationProps.current,
			paginationProps.itemsPerPage,
			type,
			states,
			debouncedSearchText,
		],
		queryFn: async () => {
			const sort = getSort(sortProps.sortBy, sortProps.sortDirection);
			const stateFilter = getStateFilter(states);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			return getCallHistory({
				count: paginationProps.itemsPerPage,
				offset: paginationProps.current,
				sort: JSON.stringify(sort),
				...(type !== 'all' && { direction: type }),
				...(stateFilter && { state: stateFilter }),
				...(debouncedSearchText && { filter: debouncedSearchText }),
			});
		},
		placeholderData: keepPreviousData,
	});

	console.log('rest', { isPending, isFetching, ...result });

	const tableData = useMemo(() => {
		return data?.items.map((item) => {
			if (item.external) {
				return {
					_id: item._id,
					contact: item.contactExtension
						? ({ number: item.contactExtension } as CallHistoryTableExternalContact)
						: ({ unknown: true } as CallHistoryUnknownContact),
					type: item.direction,
					status: item.state,
					timestamp: item.ts,
					duration: item.duration,
				};
			}
			if (!item.contactUsername || !item.contactName) {
				return {
					_id: item._id,
					contact: { unknown: true } as CallHistoryUnknownContact,
					type: item.direction,
					status: item.state,
					timestamp: item.ts,
					duration: item.duration,
				};
			}
			return {
				_id: item._id,
				rid: item.rid,
				contact: { _id: item.contactId, username: item.contactUsername, name: item.contactName } as CallHistoryTableInternalContact,
				messageId: item.messageId,
				type: item.direction,
				status: item.state,
				timestamp: item.ts,
				duration: item.duration,
			};
		});
	}, [data]);

	const contextualBar = (() => {
		if (tab?.openTab === 'user-info') {
			return <UserInfoWithData rid={tab.rid} uid={tab.userId} onClose={closeTab} onClickBack={historyId ? handleBack : undefined} />;
		}
		if (tab?.openTab === 'details' && historyId) {
			return <MediaCallHistoryContextualbar historyId={historyId} onClose={closeTab} messageRoomId={tab.rid} openUserInfo={openUserInfo} />;
		}
		return null;
	})();

	const pagination = (
		<Pagination divider count={data?.total || 0} onSetItemsPerPage={setItemsPerPage} onSetCurrent={setCurrent} {...paginationProps} />
	);

	if (isPending) {
		return (
			<CallHistoryPageLayout filterProps={filterProps}>
				<MediaCallHistoryTable sort={sortProps}>
					<GenericTableLoadingRow cols={5} />
				</MediaCallHistoryTable>
				{pagination}
			</CallHistoryPageLayout>
		);
	}

	if (error) {
		return (
			<CallHistoryPageLayout filterProps={filterProps}>
				<GenericNoResults
					icon='warning'
					title={t('Something_went_wrong')}
					description={t('Please_try_again')}
					buttonTitle={t('Reload_page')}
					buttonAction={() => refetch()}
				/>
			</CallHistoryPageLayout>
		);
	}

	return (
		<CallHistoryPageLayout filterProps={filterProps} contextualBar={contextualBar}>
			{!tableData || (tableData.length === 0 && <GenericNoResults />)}
			{tableData && tableData.length > 0 && (
				<MediaCallHistoryTable sort={sortProps}>
					{isFetching && <GenericTableLoadingRow cols={5} />}
					{tableData.map((item) => {
						if (isCallHistoryUnknownContact(item.contact)) {
							return <CallHistoryRowUnknownUser key={item._id} {...item} contact={item.contact} onClick={() => onClickRow('', item._id)} />;
						}
						if (isCallHistoryTableInternalContact(item.contact)) {
							return (
								<CallHistoryRowInternalUser
									key={item._id}
									{...item}
									contact={item.contact}
									onClick={() => onClickRow(item.rid ?? '', item._id)}
									rid={item.rid ?? ''}
									onClickUserInfo={item.rid ? openUserInfo : undefined}
								/>
							);
						}

						return <CallHistoryRowExternalUser key={item._id} {...item} contact={item.contact} onClick={() => onClickRow('', item._id)} />;
					})}
				</MediaCallHistoryTable>
			)}
			{pagination}
		</CallHistoryPageLayout>
	);
};

export default CallHistoryPage;
