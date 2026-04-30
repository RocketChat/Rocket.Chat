import type { IMessage } from '@rocket.chat/core-typings';
import { Box, MessageDivider, Throbber } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { MessageTypes } from '@rocket.chat/message-types';
import {
	VirtualizedScrollbars,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useUserPreference, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import RoomMessage from '../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../hooks/useFormatDate';
import MessageListErrorBoundary from '../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../MessageList/providers/MessageListProvider';
import { useRoomSubscription } from '../contexts/RoomContext';

type MessageListTabProps = {
	iconName: IconName;
	title: ReactNode;
	emptyResultMessage: string;
	context: MessageActionContext;
	messages: IMessage[];
	isLoading: boolean;
	isSuccess: boolean;
	isFetchingNextPage?: boolean;
	onEndReached?: () => void;
};

const MessageListTab = ({ iconName, title, emptyResultMessage, context, messages, isLoading, isSuccess, isFetchingNextPage, onEndReached }: MessageListTabProps): ReactElement => {
	const formatDate = useFormatDate();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');

	const { closeTab } = useRoomToolbox();
	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTab();
	}, [closeTab]);

	const subscription = useRoomSubscription();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name={iconName} />
				<ContextualbarTitle>{title}</ContextualbarTitle>
				<ContextualbarClose onClick={handleTabBarCloseButtonClick} />
			</ContextualbarHeader>
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{isLoading && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{isSuccess && (
					<>
						{messages.length === 0 && <ContextualbarEmptyContent title={emptyResultMessage} />}

						{messages.length > 0 && (
							<MessageListErrorBoundary>
								<MessageListProvider>
									<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
										<VirtualizedScrollbars>
											<Virtuoso
												totalCount={messages.length}
												overscan={25}
												data={messages}
												endReached={onEndReached}
												itemContent={(index, message) => {
													const previous = messages[index - 1];

													const newDay = isMessageNewDay(message, previous);

													const system = MessageTypes.isSystemMessage(message);

													const unread = subscription?.tunread?.includes(message._id) ?? false;
													const mention = subscription?.tunreadUser?.includes(message._id) ?? false;
													const all = subscription?.tunreadGroup?.includes(message._id) ?? false;

													return (
														<>
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
																	context={context}
																	showUserAvatar={showUserAvatar}
																/>
															)}
														</>
													);
												}}
											/>
										</VirtualizedScrollbars>
									</Box>
								</MessageListProvider>
							</MessageListErrorBoundary>
						)}
					</>
				)}
				{isFetchingNextPage && (
					<Box paddingInline={24} paddingBlock={8}>
						<Throbber size='x12' />
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default MessageListTab;
