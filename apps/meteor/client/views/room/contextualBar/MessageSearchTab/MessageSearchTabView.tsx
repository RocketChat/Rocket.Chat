import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
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
import type { Dispatch, SetStateAction } from 'react';
import { Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import type { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import MessageSearchForm from './components/MessageSearchForm';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import type { useFormatDate } from '../../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';

export type MessageSearchTabViewProps = {
	closeTab: () => void;
	subscription: ISubscription | undefined;
	showUserAvatar: boolean;
	providerQuery: ReturnType<typeof useMessageSearchProviderQuery>;
	searchText: string;
	globalSearch: boolean;
	handleSearch: Dispatch<SetStateAction<{ searchText: string; globalSearch: boolean }>>;
	isSuccess: boolean;
	isPending: boolean;
	messageSearchData: IMessage[] | undefined;
	itemCount: number;
	handleLoadMore: () => void;
	formatDate: ReturnType<typeof useFormatDate>;
};

const MessageSearchTabView = ({
	closeTab,
	subscription,
	showUserAvatar,
	providerQuery,
	searchText,
	handleSearch,
	isSuccess,
	isPending,
	messageSearchData,
	itemCount,
	handleLoadMore,
	formatDate,
}: MessageSearchTabViewProps) => {
	const { t } = useTranslation();
	const searchListId = useId();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{providerQuery.data && (
				<ContextualbarSection>
					<MessageSearchForm provider={providerQuery.data} onSearch={handleSearch} searchListId={searchListId} isSuccess={isSuccess} />
				</ContextualbarSection>
			)}
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={itemCount} />
				{providerQuery.isSuccess && (
					<>
						{searchText && isPending && <Throbber />}
						{isSuccess && (
							<Box id={searchListId} display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis={0}>
								{messageSearchData?.length === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
								{messageSearchData && messageSearchData.length > 0 && (
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
														endReached={handleLoadMore}
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
					<Callout m={24} type='danger'>
						{t('Search_current_provider_not_active')}
					</Callout>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default MessageSearchTabView;
