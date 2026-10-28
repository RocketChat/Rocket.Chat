import type { IMessage } from '@rocket.chat/core-typings';
import { MessageDivider, Throbber } from '@rocket.chat/fuselage';
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
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ContextualbarListStatus from '../../../components/ContextualbarList/ContextualbarListStatus';
import RoomMessage from '../../../components/message/variants/RoomMessage';
import SystemMessage from '../../../components/message/variants/SystemMessage';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useMessageRowListNavigation } from '../../../hooks/useMessageRowListNavigation';
import type { MessageActionContext } from '../../../lib/MessageAction';
import MessageListErrorBoundary from '../MessageList/MessageListErrorBoundary';
import { isMessageNewDay } from '../MessageList/lib/isMessageNewDay';
import MessageListProvider from '../MessageList/providers/MessageListProvider';
import { useRoomSubscription } from '../contexts/RoomContext';
import MessageListSection from './layout/MessageListSection';

export type MessageListTabProps = {
	iconName: IconName;
	title: ReactNode;
	emptyResultMessage: string;
	context: MessageActionContext;
	queryResult: UseQueryResult<IMessage[]>;
};

const MessageListTab = ({ iconName, title, emptyResultMessage, context, queryResult }: MessageListTabProps) => {
	const formatDate = useFormatDate();
	const messageListRef = useMessageRowListNavigation();
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
			<ContextualbarContent flush>
				{queryResult.isLoading && (
					<ContextualbarListStatus spaced>
						<Throbber size='x12' />
					</ContextualbarListStatus>
				)}
				{queryResult.isSuccess && (
					<>
						{queryResult.data.length === 0 && <ContextualbarEmptyContent title={emptyResultMessage} />}

						{queryResult.data.length > 0 && (
							<MessageListErrorBoundary>
								<MessageListProvider>
									<MessageListSection ref={messageListRef}>
										<VirtualizedScrollbars>
											<Virtuoso
												totalCount={queryResult.data.length}
												overscan={25}
												data={queryResult.data}
												itemContent={(index, message) => {
													const previous = queryResult.data[index - 1];

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
									</MessageListSection>
								</MessageListProvider>
							</MessageListErrorBoundary>
						)}
					</>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default MessageListTab;
