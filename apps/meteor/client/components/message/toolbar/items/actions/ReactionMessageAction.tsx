import {
	isOmnichannelRoom,
	isRoomFederated,
	isRoomNativeFederated,
	type IMessage,
	type IRoom,
	type ISubscription,
} from '@rocket.chat/core-typings';
import { useUser, useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEmojiPickerData } from '../../../../../contexts/EmojiPickerContext';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { useChat } from '../../../../../views/room/contexts/ChatContext';
import MessageToolbarItem from '../../MessageToolbarItem';
import MessageToolbarQuickReactions from '../../MessageToolbarQuickReactions';

export type ReactionMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const ReactionMessageAction = ({ message, room, subscription }: ReactionMessageActionProps) => {
	const chat = useChat();
	const user = useUser();
	const setReaction = useEndpoint('POST', '/v1/chat.react');
	const { quickReactions, addRecentEmoji } = useEmojiPickerData();
	const { t } = useTranslation();

	const isFederated = room && isRoomFederated(room);
	const isFederationBlocked = isFederated && !isRoomNativeFederated(room);

	// depend on post-readonly so readOnly re-evaluates when the permission toggles at runtime.
	const postReadOnly = usePermission('post-readonly', room._id);
	const enabled = useMemo(
		() => {
			if (isFederationBlocked) {
				return false;
			}

			if (!chat || isOmnichannelRoom(room) || !subscription || message.private || !user) {
				return false;
			}

			if (roomCoordinator.readOnly(room, user) && !room.reactWhenReadOnly) {
				return false;
			}

			return true;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[chat, room, subscription, message.private, user, isFederationBlocked, postReadOnly],
	);

	if (!enabled) {
		return null;
	}

	const toggleReaction = (emoji: string) => {
		setReaction({
			emoji: `:${emoji}:`,
			messageId: message._id,
		});
		addRecentEmoji(emoji);
	};

	return (
		<>
			<MessageToolbarQuickReactions reactions={quickReactions} onReact={toggleReaction} />
			<MessageToolbarItem
				id='reaction-message'
				icon='add-reaction'
				title={t('Add_Reaction')}
				onClick={(event) => {
					event.stopPropagation();
					chat?.emojiPicker.open(event.currentTarget, (emoji) => {
						toggleReaction(emoji);
					});
				}}
			/>
		</>
	);
};

export default ReactionMessageAction;
