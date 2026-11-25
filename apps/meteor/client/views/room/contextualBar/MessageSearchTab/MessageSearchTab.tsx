import { Callout, Box, MessageDivider, Throbber } from '@rocket.chat/fuselage';
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
import { useRoomToolbox, useUserPreference, useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useState, memo, Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import LocalMessageSearchResults from './components/LocalMessageSearchResults';
import LocalSearchIndexRoomPrompt from './components/LocalSearchIndexRoomPrompt';
import LocalSearchIndexStatus from './components/LocalSearchIndexStatus';
import LocalSearchIndexStatusPanel from './layout/LocalSearchIndexStatusPanel';
import MessageSearchForm from './components/MessageSearchForm';
import { canLoadMoreLocalHits, useLocalMessageSearchQuery } from './hooks/useLocalMessageSearchQuery';
import { useLocalSearchIndexBackend, useLocalSearchIndexStatus } from './hooks/useLocalSearchIndexBackend';
import { useLocalSearchIndexRoomCatchUp } from './hooks/useLocalSearchIndexChanges';
import { useLocalSearchIndexExpected } from './hooks/useLocalSearchIndexExpected';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import { useMessageSearchQuery } from './hooks/useMessageSearchQuery';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useE2EESearchPreferences } from '../../../../hooks/useE2EESearchPreferences';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { parseLocalSearchQuery } from '../../../../lib/e2eeSearch/parseLocalSearchQuery';
import { mergeSearchHits, toServerSearchHit } from '../../../../lib/e2eeSearch/serverSearchHits';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';

// TODO: Refactor this component to isolate the data from the visual
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
	const utcOffset = useUser()?.utcOffset;

	const providerQuery = useMessageSearchProviderQuery();

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });
	const indexBackend = useLocalSearchIndexBackend();
	const indexExpected = useLocalSearchIndexExpected();
	const indexStatus = useLocalSearchIndexStatus();
	const localBackend = room.encrypted ? indexBackend : undefined;
	// The local index finds the encrypted messages, and the server search finds the others.
	const localSearch = !!localBackend || (!!room.encrypted && indexExpected);
	// The device indexes only the rooms that the user chose. Another encrypted room asks the user first.
	const roomChosen = useE2EESearchPreferences().rooms.includes(room._id);
	const localQuery = useLocalMessageSearchQuery({ backend: localBackend, searchText, limit });
	useLocalSearchIndexRoomCatchUp(room._id, !!localBackend);
	const canLoadMoreLocal = canLoadMoreLocalHits(localQuery, limit);
	// With no open index, only the server search runs: the local part is done unless the index is still opening.
	const localDone = localBackend ? localQuery.isSuccess : indexStatus !== 'opening';
	const {
		isSuccess,
		data: messageSearchData,
		isPending,
		isPlaceholderData: isServerPlaceholder,
	} = useMessageSearchQuery({
		searchText,
		limit,
		globalSearch: globalSearch && !localSearch,
		enabled: !localSearch || !!searchText.trim(),
	});
	const serverDocs = localSearch && searchText.trim() && isSuccess ? messageSearchData : [];
	const dateWindow = localSearch ? parseLocalSearchQuery(searchText, { utcOffset }) : undefined;
	const canLoadMoreServer = serverDocs.length >= limit && !isServerPlaceholder;
	const localHits = localQuery.data ?? [];
	const hits = localSearch
		? mergeSearchHits([
				{ hits: localHits.map((hit) => ({ ...hit, encrypted: true })), mayHaveMore: canLoadMoreLocal, oldestTs: localHits.at(-1)?.ts },
				{
					hits: serverDocs.flatMap((message) => toServerSearchHit(message, searchText, dateWindow) ?? []),
					mayHaveMore: canLoadMoreServer,
					oldestTs: serverDocs.length ? Math.min(...serverDocs.map(({ ts }) => new Date(ts).getTime())) : undefined,
				},
			])
		: [];
	const itemCount = (localSearch ? hits.length : messageSearchData?.length) ?? 0;

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
				{providerQuery.isSuccess && localSearch && (
					<>
						{roomChosen ? <LocalSearchIndexStatus backend={localBackend} rid={room._id} /> : <LocalSearchIndexRoomPrompt rid={room._id} />}
						{!localBackend && indexStatus !== 'opening' && (
							<LocalSearchIndexStatusPanel>
								<Callout type='warning' data-qa='local-search-index-unavailable'>
									{t(indexStatus === 'failed' ? 'E2E_Local_Search_Index_Failed' : 'E2E_Local_Search_Index_Closed')}
								</Callout>
							</LocalSearchIndexStatusPanel>
						)}
						{searchText.trim() && (!localDone || (localBackend && localQuery.isPending) || isPending) && <Throbber />}
						{searchText.trim() && localDone && !isPending && hits.length === 0 && (
							<ContextualbarEmptyContent title={t('No_results_found')} />
						)}
						{hits.length > 0 && (
							<LocalMessageSearchResults
								id={searchListId}
								hits={hits}
								showUserAvatar={showUserAvatar}
								onEndReached={canLoadMoreLocal || canLoadMoreServer ? () => setLimit((limit) => limit + pageSize) : undefined}
							/>
						)}
					</>
				)}
				{providerQuery.isSuccess && !localSearch && (
					<>
						{searchText && isPending && <Throbber />}
						{isSuccess && (
							<Box id={searchListId} display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis={0}>
								{messageSearchData.length === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
								{messageSearchData.length > 0 && (
									<MessageListErrorBoundary>
										<MessageListProvider>
											<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
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
														endReached={() => {
															setLimit((limit) => limit + pageSize);
														}}
													/>
												</VirtualizedScrollbars>
											</Box>
										</MessageListProvider>
									</MessageListErrorBoundary>
								)}
							</Box>
						)}
					</>
				)}
				{providerQuery.isError && (
					<Box padding={24}>
						<Callout type='danger'>{t('Search_current_provider_not_active')}</Callout>
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default memo(MessageSearchTab);
