import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Throbber, MessageDivider } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBarClose from '../../../../components/VerticalBar/VerticalBarClose';
import VerticalBarContent from '../../../../components/VerticalBar/VerticalBarContent';
import VerticalBarHeader from '../../../../components/VerticalBar/VerticalBarHeader';
import VerticalBarIcon from '../../../../components/VerticalBar/VerticalBarIcon';
import VerticalBarText from '../../../../components/VerticalBar/VerticalBarText';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { isMessageFirstUnread } from '../../MessageList/lib/isMessageFirstUnread';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useTabBarClose } from '../../contexts/ToolboxContext';

const StarredMessages = (): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const closeTabBar = useTabBarClose();
	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTabBar();
	}, [closeTabBar]);

	const room = useRoom();
	const subscription = useRoomSubscription();

	const getStarredMessages = useEndpoint('GET', '/v1/chat.getStarredMessages');

	const starredMessagesQueryResult = useQuery(['rooms', room._id, 'starred-messages'] as const, async () => {
		const messages: IMessage[] = [];

		for (
			let offset = 0, result = await getStarredMessages({ roomId: room._id, offset: 0 });
			result.count > 0;
			// eslint-disable-next-line no-await-in-loop
			offset += result.count, result = await getStarredMessages({ roomId: room._id, offset })
		) {
			messages.push(...result.messages.map(mapMessageFromApi));
		}

		return messages;
	});

	return (
		<>
			<VerticalBarHeader>
				<VerticalBarIcon name='star' />
				<VerticalBarText>{t('Starred_Messages')}</VerticalBarText>
				<VerticalBarClose onClick={handleTabBarCloseButtonClick} />
			</VerticalBarHeader>
			<VerticalBarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{starredMessagesQueryResult.isLoading && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size={12} />
					</Box>
				)}
				{starredMessagesQueryResult.isSuccess && (
					<>
						{starredMessagesQueryResult.data.length === 0 && (
							<Box p={24} color='annotation' textAlign='center' width='full'>
								{t('No_starred_messages')}
							</Box>
						)}

						{starredMessagesQueryResult.data.length > 0 && (
							<MessageListErrorBoundary>
								<MessageListProvider>
									<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
										<Virtuoso
											totalCount={starredMessagesQueryResult.data.length}
											overscan={25}
											data={starredMessagesQueryResult.data}
											components={{ Scroller: ScrollableContentWrapper }}
											itemContent={(index, message) => {
												const previous = starredMessagesQueryResult.data[index - 1];

												const newDay = isMessageNewDay(message, previous);
												const firstUnread = isMessageFirstUnread(subscription, message, previous);
												const showDivider = newDay || firstUnread;

												const system = MessageTypes.isSystemMessage(message);

												const unread = subscription?.tunread?.includes(message._id) ?? false;
												const mention = subscription?.tunreadUser?.includes(message._id) ?? false;
												const all = subscription?.tunreadGroup?.includes(message._id) ?? false;

												return (
													<>
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
																context='starred'
															/>
														)}
													</>
												);
											}}
										/>
									</Box>
								</MessageListProvider>
							</MessageListErrorBoundary>
						)}
					</>
				)}
			</VerticalBarContent>
		</>
	);
};

export default StarredMessages;
