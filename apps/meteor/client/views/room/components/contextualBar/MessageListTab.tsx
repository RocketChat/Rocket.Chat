import type { IMessage } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import { Box, MessageDivider, Throbber } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement, ComponentProps, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import type { MessageActionContext } from '../../../../../app/ui-utils/client/lib/MessageAction';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBarClose from '../../../../components/VerticalBar/VerticalBarClose';
import VerticalBarContent from '../../../../components/VerticalBar/VerticalBarContent';
import VerticalBarHeader from '../../../../components/VerticalBar/VerticalBarHeader';
import VerticalBarIcon from '../../../../components/VerticalBar/VerticalBarIcon';
import VerticalBarText from '../../../../components/VerticalBar/VerticalBarText';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { isMessageFirstUnread } from '../../MessageList/lib/isMessageFirstUnread';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';
import { useRoomSubscription } from '../../contexts/RoomContext';
import { useTabBarClose } from '../../contexts/ToolboxContext';

type MessageListTabProps = {
	iconName: ComponentProps<typeof Icon>['name'];
	title: ReactNode;
	emptyResultMessage: ReactNode;
	context: MessageActionContext;
	queryResult: UseQueryResult<IMessage[]>;
};

const MessageListTab = ({ iconName, title, emptyResultMessage, context, queryResult }: MessageListTabProps): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const closeTabBar = useTabBarClose();
	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTabBar();
	}, [closeTabBar]);

	const subscription = useRoomSubscription();

	return (
		<>
			<VerticalBarHeader>
				<VerticalBarIcon name={iconName} />
				<VerticalBarText>{title}</VerticalBarText>
				<VerticalBarClose onClick={handleTabBarCloseButtonClick} />
			</VerticalBarHeader>
			<VerticalBarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{queryResult.isLoading && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size={12} />
					</Box>
				)}
				{queryResult.isSuccess && (
					<>
						{queryResult.data.length === 0 && (
							<Box p={24} color='annotation' textAlign='center' width='full'>
								{emptyResultMessage}
							</Box>
						)}

						{queryResult.data.length > 0 && (
							<MessageListErrorBoundary>
								<MessageListProvider>
									<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
										<Virtuoso
											totalCount={queryResult.data.length}
											overscan={25}
											data={queryResult.data}
											components={{ Scroller: ScrollableContentWrapper }}
											itemContent={(index, message) => {
												const previous = queryResult.data[index - 1];

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
																context={context}
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

export default MessageListTab;
