import { isOmnichannelRoom, type IMessage, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useUser, useMethod } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useEmojiPickerData } from '../../../../../contexts/EmojiPickerContext';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import EmojiElement from '../../../../../views/composer/EmojiPicker/EmojiElement';
import { useChat } from '../../../../../views/room/contexts/ChatContext';
import MessageToolbarItem from '../../MessageToolbarItem';

type ReactionMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const ReactionMessageAction = ({ message, room, subscription }: ReactionMessageActionProps) => {
	const chat = useChat();
	const user = useUser();
	const setReaction = useMethod('setReaction');
	const quickReactionsEnabled = useFeaturePreview('quickReactions');
	const { quickReactions, addRecentEmoji } = useEmojiPickerData();
	const { t } = useTranslation();

	if (!chat || !room || isOmnichannelRoom(room) || !subscription || message.private || !user) {
		return null;
	}

	if (roomCoordinator.readOnly(room._id, user) && !room.reactWhenReadOnly) {
		return null;
	}

	const toggleReaction = (emoji: string) => {
		setReaction(`:${emoji}:`, message._id);
		addRecentEmoji(emoji);
	};

	return (
		<>
			{quickReactionsEnabled &&
				quickReactions.slice(0, 3).map(({ emoji, image }) => {
					return <EmojiElement key={emoji} small title={emoji} emoji={emoji} image={image} onClick={() => toggleReaction(emoji)} />;
				})}
			<MessageToolbarItem
				id='reaction-message'
				icon='add-reaction'
				title={t('Add_Reaction')}
				qa='Add_Reaction'
				onClick={(event) => {
					event.stopPropagation();
					chat.emojiPicker.open(event.currentTarget, (emoji) => {
						toggleReaction(emoji);
					});
				}}
			/>
		</>
	);
};

export default ReactionMessageAction;
