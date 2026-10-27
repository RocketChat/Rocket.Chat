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
import { useRoomToolbox, useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useState, memo, Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import LocalMessageSearchResults from './components/LocalMessageSearchResults';
import LocalSearchIndexStatus from './components/LocalSearchIndexStatus';
import MessageSearchForm from './components/MessageSearchForm';
import { useLocalMessageSearchQuery } from './hooks/useLocalMessageSearchQuery';
import { useLocalSearchIndexBackend } from './hooks/useLocalSearchIndexBackend';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import { useMessageSearchQuery } from './hooks/useMessageSearchQuery';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../hooks/useFormatDate';
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

	const providerQuery = useMessageSearchProviderQuery();

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });
	const indexBackend = useLocalSearchIndexBackend();
	const localBackend = room.encrypted ? indexBackend : undefined;
	const localSearch = !!localBackend;
	const localQuery = useLocalMessageSearchQuery({ backend: localBackend, searchText, limit });
	const {
		isSuccess,
		data: messageSearchData,
		isPending,
	} = useMessageSearchQuery({ searchText, limit, globalSearch, enabled: !localSearch });
	const itemCount = (localSearch ? localQuery.data?.length : messageSearchData?.length) ?? 0;

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
						<LocalSearchIndexStatus />
						{searchText && localQuery.isPending && <Throbber />}
						{searchText.trim() && localQuery.isSuccess && localQuery.data.length === 0 && (
							<ContextualbarEmptyContent title={t('No_results_found')} />
						)}
						{localQuery.isSuccess && localQuery.data.length > 0 && (
							<LocalMessageSearchResults id={searchListId} hits={localQuery.data} showUserAvatar={showUserAvatar} />
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
