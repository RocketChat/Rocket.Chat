import type { IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { createFakeRoom, createFakeSubscription } from '@rocket.chat/mock-providers';
import { useMemo } from 'react';
import { action } from 'storybook/actions';

import RoomConversationRow from './RoomConversationRow';
import ThreadConversationRow from './ThreadConversationRow';
import { IGNORED_AUTHOR, createConversationHistory } from './createConversationHistory';
import type { MessageDisplayContextValue } from '../../../Message/contexts/MessageDisplayContext';
import { MessageDisplayContext, messageDisplayDefaultValue } from '../../../Message/contexts/MessageDisplayContext';
import type { MessageInteractionsContextValue } from '../../../Message/contexts/MessageInteractionsContext';
import { MessageInteractionsContext, messageInteractionsDefaultValue } from '../../../Message/contexts/MessageInteractionsContext';
import { MessageNavigationContext, messageNavigationDefaultValue } from '../../../Message/contexts/MessageNavigationContext';
import type { MessageRelatedDataContextValue } from '../../../Message/contexts/MessageRelatedDataContext';
import { MessageRelatedDataContext, messageRelatedDataDefaultValue } from '../../../Message/contexts/MessageRelatedDataContext';
import { MessageSelectionContext, createMessageSelectionStore } from '../../../Message/contexts/MessageSelectionContext';
import type { MessageToolbarContextValue } from '../../../Message/contexts/MessageToolbarContext';
import { MessageToolbarContext } from '../../../Message/contexts/MessageToolbarContext';
import MessageList from '../../MessageList';
import MessageListDateBubble from '../../MessageListDateBubble';
import MessageListJumpToLatestButton from '../../MessageListJumpToLatestButton';
import MessageListNewMessagesButton from '../../MessageListNewMessagesButton';
import { useFakeMessageSource, VIEWER } from '../useFakeMessageSource';

export type ConversationPlaygroundProps = {
	layout: 'room' | 'thread';
	size?: number;
	isSelecting?: boolean;
	display?: Partial<MessageDisplayContextValue>;
};

const isOwnMessage = (message: IMessage) => message.u._id === VIEWER._id;

const room = createFakeRoom({ _id: 'room', t: 'c', name: 'general' });
const subscription = createFakeSubscription({ rid: 'room', u: VIEWER });
const conversation = { data: { room, subscription }, isLoading: false, isError: false };

const toolbar: MessageToolbarContextValue = {
	useMenuActions: () => [
		{ id: 'permalink', icon: 'permalink', label: 'Copy_link', order: 5, group: 'menu', type: 'duplication', action: action('permalink') },
		{ id: 'pin-message', icon: 'pin', label: 'Pin', order: 2, group: 'menu', type: 'interaction', action: action('pin') },
	],
	useAiActions: () => [],
	useQuickReactions: () => ['thumbsup', 'tada', 'eyes'],
};

/** A room or a thread rendering the real message variants, fed by the simulated server. */
const ConversationPlayground = ({ layout, size = 120, isSelecting = false, display }: ConversationPlaygroundProps) => {
	const history = useMemo(() => {
		const conversation = createConversationHistory(size);
		if (layout === 'room') {
			return conversation;
		}
		const [main, ...rest] = conversation.filter((message) => !message.tmid && !message.t);
		return [main, ...rest.slice(0, 40).map((message) => ({ ...message, tmid: main._id }))];
	}, [layout, size]);

	const source = useFakeMessageSource({ history, pageSize: 40, latency: 200, firstUnreadMessageId: history[history.length - 6]?._id });

	const relatedData = useMemo<MessageRelatedDataContextValue>(() => {
		const findMessage = (messageId: string) => ({
			data: source.history.find((message) => message._id === messageId),
			isLoading: false,
			isError: false,
		});
		return {
			...messageRelatedDataDefaultValue,
			useParentMessage: findMessage,
			useMessageById: findMessage,
			useConversation: () => conversation,
		};
	}, [source.history]);

	const interactions = useMemo<MessageInteractionsContextValue>(
		() => ({
			...messageInteractionsDefaultValue,
			...Object.fromEntries(Object.keys(messageInteractionsDefaultValue).map((name) => [name, action(name)])),
			hasReacted: (message, reaction) => !!message.reactions?.[reaction]?.usernames.includes(VIEWER.username),
			canDelete: isOwnMessage,
		}),
		[],
	);

	const navigation = useMemo(
		() => ({
			...messageNavigationDefaultValue,
			...Object.fromEntries(Object.keys(messageNavigationDefaultValue).map((name) => [name, action(name)])),
			getPermalink: async (messageId: string) => `https://open.rocket.chat/channel/general?msg=${messageId}`,
		}),
		[],
	);

	const selection = useMemo(() => (isSelecting ? createMessageSelectionStore({ isSelecting: true }) : undefined), [isSelecting]);

	const isThread = layout === 'thread';

	return (
		<MessageDisplayContext.Provider
			value={{
				...messageDisplayDefaultValue,
				showRoles: true,
				embedsEnabled: true,
				isStarred: (message) => message.pinned === true,
				...display,
			}}
		>
			<MessageToolbarContext.Provider value={toolbar}>
				<MessageNavigationContext.Provider value={navigation}>
					<MessageInteractionsContext.Provider value={interactions}>
						<MessageRelatedDataContext.Provider value={relatedData}>
							<MessageSelectionContext.Provider value={selection}>
								<Box height={560} width={isThread ? 400 : 720} maxWidth='100%' borderWidth='default' borderColor='light'>
									<MessageList<IMessage>
										aria-label={isThread ? 'Thread message list' : 'Message list'}
										messages={source.messages}
										hasOlderMessages={source.hasOlderMessages}
										hasNewerMessages={source.hasNewerMessages}
										isLoadingOlderMessages={source.isLoadingOlderMessages}
										isLoadingNewerMessages={source.isLoadingNewerMessages}
										onLoadOlderMessages={source.loadOlder}
										onLoadNewerMessages={source.loadNewer}
										onJumpToLatest={source.jumpToLatest}
										firstUnreadMessageId={source.firstUnreadMessageId}
										isOwnMessage={isOwnMessage}
										groupsThreadReplies={!isThread}
										renderMessage={(row) =>
											isThread ? (
												<ThreadConversationRow row={row} />
											) : (
												<RoomConversationRow row={row} ignoredUserIds={[IGNORED_AUTHOR._id]} unreadThreadIds={[]} />
											)
										}
									>
										<MessageListDateBubble />
										{!isThread && <MessageListNewMessagesButton />}
										{!isThread && <MessageListJumpToLatestButton />}
									</MessageList>
								</Box>
							</MessageSelectionContext.Provider>
						</MessageRelatedDataContext.Provider>
					</MessageInteractionsContext.Provider>
				</MessageNavigationContext.Provider>
			</MessageToolbarContext.Provider>
		</MessageDisplayContext.Provider>
	);
};

export default ConversationPlayground;
