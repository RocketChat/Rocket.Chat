import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { Fragment, useMemo } from 'react';

import { FileGroupMessage } from './FileGroupMessage';
import { MessageListItem } from './MessageListItem';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useMessages } from './hooks/useMessages';
import { isFileMessage } from './lib/isFileMessage';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
};

/**
 * Computes file groups: consecutive sequential file-only messages are grouped together.
 * Batch boundaries are determined by the `groupable` flag set during upload:
 * the first file in a batch has `groupable: false`, subsequent files have `groupable: true`.
 */
const computeFileGroups = (messages: IMessage[], messageGroupingPeriod: number) => {
	const groupLeaders = new Map<string, IMessage[]>();
	const groupedIds = new Set<string>();

	let i = 0;
	while (i < messages.length) {
		const msg = messages[i];
		if (!isFileMessage(msg) || MessageTypes.isSystemMessage(msg) || isThreadMessage(msg)) {
			i++;
			continue;
		}

		const group: IMessage[] = [msg];
		let j = i + 1;
		while (j < messages.length) {
			const next = messages[j];
			const prev = messages[j - 1];
			if (
				!isFileMessage(next) ||
				MessageTypes.isSystemMessage(next) ||
				isThreadMessage(next) ||
				!isMessageSequential(next, prev, messageGroupingPeriod)
			) {
				break;
			}
			group.push(next);
			j++;
		}

		if (group.length >= 2) {
			groupLeaders.set(msg._id, group);
			for (let k = 1; k < group.length; k++) {
				groupedIds.add(group[k]._id);
			}
		}

		i = j;
	}

	return { groupLeaders, groupedIds };
};

export const MessageList = function MessageList({ rid, messageListRef }: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const firstUnreadMessageId = useFirstUnreadMessageId();

	const { groupLeaders, groupedIds } = useMemo(() => computeFileGroups(messages, messageGroupingPeriod), [messages, messageGroupingPeriod]);

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				{messages.map((message, index, { [index - 1]: previous }) => {
					// Skip messages that are part of a file group (handled by their leader)
					if (groupedIds.has(message._id)) {
						return null;
					}

					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
					const showUnreadDivider = firstUnreadMessageId === message._id;
					const system = MessageTypes.isSystemMessage(message);
					const visible = !isThreadMessage(message) && !system;

					// If this message is a file group leader, render the FileGroupMessage
					const fileGroup = groupLeaders.get(message._id);
					if (fileGroup && visible) {
						return (
							<Fragment key={message._id}>
								<FileGroupMessage
									messages={fileGroup}
									previous={previous}
									showUnreadDivider={showUnreadDivider}
									showUserAvatar={showUserAvatar}
									sequential={sequential}
								/>
							</Fragment>
						);
					}

					return (
						<Fragment key={message._id}>
							<MessageListItem
								message={message}
								previous={previous}
								showUnreadDivider={showUnreadDivider}
								showUserAvatar={showUserAvatar}
								sequential={sequential}
								visible={visible}
								subscription={subscription}
								system={system}
							/>
						</Fragment>
					);
				})}
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
