import { Box, MessageDivider } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { Fragment, memo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../../../app/ui-utils/client';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import RoomMessage from '../../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../../../MessageList/MessageListErrorBoundary';
import { isMessageFirstUnread } from '../../../MessageList/lib/isMessageFirstUnread';
import { isMessageNewDay } from '../../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../../MessageList/providers/MessageListProvider';
import LoadingMessagesIndicator from '../../../components/body/LoadingMessagesIndicator';
import { useRoomSubscription } from '../../../contexts/RoomContext';
import { useMessageSearchQuery } from '../hooks/useMessageSearchQuery';

type MessageSearchProps = {
	searchText: string;
	globalSearch: boolean;
};

const MessageSearch = ({ searchText, globalSearch }: MessageSearchProps): ReactElement => {
	const pageSize = useSetting<number>('PageSize') ?? 10;

	const [limit, setLimit] = useState(pageSize);
	const messageSearchQuery = useMessageSearchQuery({ searchText, limit, globalSearch });

	const subscription = useRoomSubscription();

	const formatDate = useFormatDate();
	const t = useTranslation();

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis={0}>
			{messageSearchQuery.data && (
				<>
					{messageSearchQuery.data.length === 0 && (
						<Box p={24} color='annotation' textAlign='center' width='full'>
							{t('No_results_found')}
						</Box>
					)}
					{messageSearchQuery.data.length > 0 && (
						<MessageListErrorBoundary>
							<MessageListProvider>
								<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
									<Virtuoso
										totalCount={messageSearchQuery.data.length}
										overscan={25}
										data={messageSearchQuery.data}
										components={{ Scroller: ScrollableContentWrapper }}
										itemContent={(index, message) => {
											const previous = messageSearchQuery.data[index - 1];

											const newDay = isMessageNewDay(message, previous);
											const firstUnread = isMessageFirstUnread(subscription, message, previous);
											const showDivider = newDay || firstUnread;

											const system = MessageTypes.isSystemMessage(message);

											const unread = subscription?.tunread?.includes(message._id) ?? false;
											const mention = subscription?.tunreadUser?.includes(message._id) ?? false;
											const all = subscription?.tunreadGroup?.includes(message._id) ?? false;

											return (
												<Fragment key={message._id}>
													{showDivider && (
														<MessageDivider unreadLabel={firstUnread ? t('Unread_Messages').toLowerCase() : undefined}>
															{newDay && formatDate(message.ts)}
														</MessageDivider>
													)}

													{system ? (
														<SystemMessage message={message} />
													) : (
														<RoomMessage
															message={message}
															sequential={false}
															unread={unread}
															mention={mention}
															all={all}
															context='search'
															searchText={searchText}
														/>
													)}
												</Fragment>
											);
										}}
										endReached={() => {
											setLimit((limit) => limit + pageSize);
										}}
									/>
								</Box>
							</MessageListProvider>
						</MessageListErrorBoundary>
					)}
				</>
			)}
			{searchText && messageSearchQuery.isLoading && <LoadingMessagesIndicator />}
		</Box>
	);
};

export default memo(MessageSearch);
