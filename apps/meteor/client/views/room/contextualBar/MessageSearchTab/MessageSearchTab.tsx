import { Callout, MessageDivider, Throbber } from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarIcon,
	ContextualbarSection,
	ContextualbarDialog,
	VirtualizedScrollbars,
	ContextualbarEmptyContent,
} from '@rocket.chat/ui-client';
import { useRoomToolbox, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useState, memo, Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import LocalSearchIndexStatus from './components/LocalSearchIndexStatus';
import MessageSearchForm from './components/MessageSearchForm';
import { canLoadMoreLocalHits, useLocalMessageSearchQuery } from './hooks/useLocalMessageSearchQuery';
import { useLocalSearchHits } from './hooks/useLocalSearchHits';
import {
	supportsLocalSearch,
	useLocalSearchIndexBackend,
	useLocalSearchIndexOpenResult,
	useLocalSearchIndexStatus,
} from './hooks/useLocalSearchIndexBackend';
import { useLocalSearchIndexRoomCatchUp } from './hooks/useLocalSearchIndexChanges';
import { useLocalSearchIndexExpected } from './hooks/useLocalSearchIndexExpected';
import { useLocalSearchIndexProgress } from './hooks/useLocalSearchIndexProgress';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import { useMessageSearchQuery } from './hooks/useMessageSearchQuery';
import MessageSearchMessageList from './layout/MessageSearchMessageList';
import MessageSearchResultsRegion from './layout/MessageSearchResultsRegion';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import LocalMessageSearchResults from '../../../../lib/e2eeSearch/ui/LocalMessageSearchResults';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';

const MessageSearchTab = () => {
	const { t } = useTranslation();
	const searchListId = useId();
	const formatDate = useFormatDate();
	const { closeTab } = useRoomToolbox();
	const pageSize = useSetting('PageSize', 10);
	const [limit, setLimit] = useState(pageSize);
	const room = useRoom();
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const providerQuery = useMessageSearchProviderQuery();
	const [{ searchText, globalSearch }, setSearch] = useState({ searchText: '', globalSearch: false });
	const indexBackend = useLocalSearchIndexBackend();
	const openResult = useLocalSearchIndexOpenResult();
	const indexStatus = useLocalSearchIndexStatus();
	const indexExpected = useLocalSearchIndexExpected(openResult, indexStatus);
	const progress = useLocalSearchIndexProgress();
	const localBackend = room.encrypted && supportsLocalSearch(indexBackend, openResult) ? indexBackend : undefined;
	const localSearch = !!localBackend || (!!room.encrypted && indexExpected);
	const localQuery = useLocalMessageSearchQuery({ backend: localBackend, openResult, searchText, limit });
	const localResults = useLocalSearchHits(localQuery.data);
	useLocalSearchIndexRoomCatchUp(room._id, !!localBackend);
	const canLoadMoreLocal = canLoadMoreLocalHits(localQuery, limit);
	const {
		isSuccess,
		data: messageSearchData,
		isPending,
	} = useMessageSearchQuery({ searchText, limit, globalSearch, enabled: !localSearch });
	const itemCount = (localSearch ? localQuery.data?.length : messageSearchData?.length) ?? 0;
	const handleSearch = (params: { searchText: string; globalSearch: boolean }) => {
		setLimit(pageSize);
		setSearch(params);
	};

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{providerQuery.data && (
				<ContextualbarSection>
					<MessageSearchForm
						provider={providerQuery.data}
						onSearch={handleSearch}
						searchListId={searchListId}
						isSuccess={localSearch ? localQuery.isSuccess : isSuccess}
						localSearch={localSearch}
					/>
				</ContextualbarSection>
			)}
			<ContextualbarContent flush>
				<ResultsLiveRegion shouldAnnounce={localSearch ? localQuery.isSuccess : isSuccess} itemCount={itemCount} />
				{localSearch && (
					<>
						<LocalSearchIndexStatus status={indexStatus} progress={progress} encryptedAtRest={openResult?.encryptedAtRest} />
						{searchText.trim() && (localBackend ? localQuery.isPending : indexStatus === 'opening') && <Throbber />}
						{localQuery.isError && (
							<ContextualbarSection>
								<Callout type='danger' role='alert'>
									{t('Search_message_search_failed')}
								</Callout>
							</ContextualbarSection>
						)}
						{searchText.trim() && localQuery.isSuccess && localQuery.data.length === 0 && (
							<ContextualbarEmptyContent title={t('No_results_found')} />
						)}
						{localQuery.isSuccess && localQuery.data.length > 0 && (
							<LocalMessageSearchResults
								id={searchListId}
								hits={localResults.hits}
								showUserAvatar={showUserAvatar}
								onOpenHit={localResults.onOpenHit}
								onEndReached={canLoadMoreLocal ? () => setLimit((limit) => limit + pageSize) : undefined}
							/>
						)}
					</>
				)}
				{providerQuery.isSuccess && !localSearch && (
					<>
						{searchText && isPending && <Throbber />}
						{isSuccess && (
							<MessageSearchResultsRegion id={searchListId}>
								{messageSearchData.length === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
								{messageSearchData.length > 0 && (
									<MessageListErrorBoundary>
										<MessageListProvider>
											<MessageSearchMessageList>
												<VirtualizedScrollbars>
													<Virtuoso
														totalCount={messageSearchData.length}
														overscan={25}
														data={messageSearchData}
														itemContent={(index, message) => {
															const previous = messageSearchData[index - 1];
															const newDay = isMessageNewDay(message, previous);
															const system = MessageTypes.isSystemMessage(message);
															const unread = subscription?.tunread?.includes(message._id) ?? false;
															const mention = subscription?.tunreadUser?.includes(message._id) ?? false;
															const all = subscription?.tunreadGroup?.includes(message._id) ?? false;
															return (
																<Fragment key={message._id}>
																	{newDay && <MessageDivider>{formatDate(message.ts)}</MessageDivider>}
																	{system ? (
																		<SystemMessage message={message} showUserAvatar={showUserAvatar} />
																	) : (
																		<RoomMessage
																			message={message}
																			sequential={false}
																			unread={unread}
																			mention={mention}
																			all={all}
																			context='search'
																			searchText={searchText}
																			showUserAvatar={showUserAvatar}
																		/>
																	)}
																</Fragment>
															);
														}}
														endReached={() => setLimit((limit) => limit + pageSize)}
													/>
												</VirtualizedScrollbars>
											</MessageSearchMessageList>
										</MessageListProvider>
									</MessageListErrorBoundary>
								)}
							</MessageSearchResultsRegion>
						)}
					</>
				)}
				{providerQuery.isError && !localSearch && (
					<ContextualbarSection>
						<Callout type='danger'>{t('Search_current_provider_not_active')}</Callout>
					</ContextualbarSection>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default memo(MessageSearchTab);
