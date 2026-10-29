import { isOmnichannelRoom, isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useUser, usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import QuickReactionButton from './QuickReactionButton';
import { useMessageInteractions } from '../../../contexts/MessageInteractionsContext';
import { useMessageToolbar } from '../../../contexts/MessageToolbarContext';
import MessageToolbarItem from '../../MessageToolbarItem';
import { useHoldMessageToolbar } from '../../MessageToolbarVisibilityContext';

export type ReactionMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const QUICK_REACTIONS_SHOWN = 3;

const isReadOnlyFor = (room: IRoom, username: IUser['username'], canPostReadOnly: boolean) => {
	if (!username) {
		return Boolean(room.ro);
	}

	if (room.muted?.includes(username)) {
		return true;
	}

	if (!room.ro) {
		return false;
	}

	return !room.unmuted?.includes(username) && !canPostReadOnly;
};

const ReactionMessageAction = ({ message, room, subscription }: ReactionMessageActionProps) => {
	const user = useUser();
	const { toggleReaction, openReactionPicker } = useMessageInteractions();
	const quickReactions = useMessageToolbar().useQuickReactions();
	const holdToolbar = useHoldMessageToolbar();
	const canPostReadOnly = usePermission('post-readonly', room._id);
	const { t } = useTranslation();

	const isFederationBlocked = isRoomFederated(room) && !isRoomNativeFederated(room);

	if (isFederationBlocked || isOmnichannelRoom(room) || !subscription || message.private || !user) {
		return null;
	}

	if (isReadOnlyFor(room, user.username, canPostReadOnly) && !room.reactWhenReadOnly) {
		return null;
	}

	return (
		<>
			{quickReactions.slice(0, QUICK_REACTIONS_SHOWN).map((emoji) => (
				<QuickReactionButton key={emoji} emoji={emoji} onClick={() => toggleReaction(message, `:${emoji}:`)} />
			))}
			<MessageToolbarItem
				id='reaction-message'
				icon='add-reaction'
				title={t('Add_Reaction')}
				onClick={(event) => {
					event.stopPropagation();
					holdToolbar(true);
					openReactionPicker(event, message, { onClose: () => holdToolbar(false) });
				}}
			/>
		</>
	);
};

export default ReactionMessageAction;
