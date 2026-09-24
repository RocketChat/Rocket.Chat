import {
	isOmnichannelRoom,
	isRoomFederated,
	isRoomNativeFederated,
	type IMessage,
	type IRoom,
	type ISubscription,
} from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import EmojiElement from '../../../../../views/composer/EmojiPicker/EmojiElement';
import { useMessageActions, useMessageActionsPolicy } from '../../../list/MessageListContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type ReactionMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const ReactionMessageAction = ({ message, room, subscription }: ReactionMessageActionProps) => {
	const { user, chatAvailable, quickReactions, permissions } = useMessageActionsPolicy();
	const actions = useMessageActions();
	const { t } = useTranslation();

	const isFederated = room && isRoomFederated(room);
	const isFederationBlocked = isFederated && !isRoomNativeFederated(room);

	// depend on post-readonly so readOnly re-evaluates when the permission toggles at runtime.
	const { postReadOnly } = permissions;
	const enabled = useMemo(
		() => {
			if (isFederationBlocked) {
				return false;
			}

			if (!chatAvailable || isOmnichannelRoom(room) || !subscription || message.private || !user) {
				return false;
			}

			if (roomCoordinator.readOnly(room, user) && !room.reactWhenReadOnly) {
				return false;
			}

			return true;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[chatAvailable, room, subscription, message.private, user, isFederationBlocked, postReadOnly],
	);

	if (!enabled) {
		return null;
	}

	const toggleReaction = (emoji: string) => actions.react(message, emoji);

	return (
		<>
			{quickReactions.slice(0, 3).map(({ emoji, image }) => {
				return <EmojiElement key={emoji} small title={emoji} emoji={emoji} image={image} onClick={() => toggleReaction(emoji)} />;
			})}
			<MessageToolbarItem
				id='reaction-message'
				icon='add-reaction'
				title={t('Add_Reaction')}
				onClick={(event) => {
					event.stopPropagation();
					actions.openReactionPicker(message, event.currentTarget);
				}}
			/>
		</>
	);
};

export default ReactionMessageAction;
