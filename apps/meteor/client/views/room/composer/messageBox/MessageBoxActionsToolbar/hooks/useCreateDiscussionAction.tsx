import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';

import { useComposerCapabilities } from '../../../ComposerCapabilitiesContext';
import { useComposerMenuActions } from '../../../ComposerMenuActionsContext';

export const useCreateDiscussionAction = (disabled: boolean, room?: IRoom): GenericMenuItemProps => {
	const t = useTranslation();
	const { createDiscussion } = useComposerMenuActions();

	if (!room) {
		throw new Error('Invalid room');
	}

	const handleCreateDiscussion = () => createDiscussion(room);

	const { discussionEnabled, canStartDiscussion, canStartDiscussionOtherUser: canSstartDiscussionOtherUser } = useComposerCapabilities();

	const allowDiscussion = room && discussionEnabled && !isRoomFederated(room) && (canStartDiscussion || canSstartDiscussionOtherUser);

	return {
		id: 'create-discussion',
		content: t('Discussion'),
		icon: 'discussion',
		disabled: !allowDiscussion || disabled,
		onClick: handleCreateDiscussion,
	};
};
