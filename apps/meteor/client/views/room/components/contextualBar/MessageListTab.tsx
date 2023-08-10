import type { IMessage } from '@rocket.chat/core-typings';
import { Box, MessageDivider, Throbber } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import type { MessageActionContext } from '../../../../../app/ui-utils/client/lib/MessageAction';
import {
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
} from '../../../../components/Contextualbar';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import RoomMessage from '../../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../../MessageList/MessageListErrorBoundary';
import { isMessageFirstUnread } from '../../MessageList/lib/isMessageFirstUnread';
import { isMessageNewDay } from '../../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../MessageList/providers/MessageListProvider';
import { useRoomSubscription } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type MessageListTabProps = {
	iconName: IconName;
	title: ReactNode;
	emptyResultMessage: string;
	context: MessageActionContext;
	queryResult: UseQueryResult<IMessage[]>;
};

const MessageListTab = ({ iconName, title, emptyResultMessage, context, queryResult }: MessageListTabProps): ReactElement => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');

	const { closeTab } = useRoomToolbox();
	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTab();
	}, [closeTab]);

	const subscription = useRoomSubscription();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name={iconName} />
				<ContextualbarTitle>{title}</ContextualbarTitle>
				<ContextualbarClose onClick={handleTabBarCloseButtonClick} />
			</ContextualbarHeader>
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{queryResult.isLoading && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{queryResult.isSuccess && (
					<>
						{queryResult.data.length === 0 && <ContextualbarEmptyContent title={emptyResultMessage} />}

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
															<SystemMessage message={message} showUserAvatar={showUserAvatar} />
														) : (
															<RoomMessage
																message={message}
																sequential={false}
																unread={unread}
																mention={mention}
																all={all}
																context={context}
																showUserAvatar={showUserAvatar}
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
			</ContextualbarContent>
		</>
	);
};

export default MessageListTab;
