import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import CreateDiscussion from '../../../../../../components/CreateDiscussion';

export const useCreateDiscussionAction = (room: IRoom | undefined) => {
	const setModal = useSetModal();

	if (!room) {
		throw new Error('useCreateDiscussionAction must be used within a Room');
	}

	const discussionEnabled = useSetting('Discussion_enabled') as boolean;
	const canStartDiscussion = usePermission('start-discussion', room._id);
	const canStartDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);

	const allowDiscussion = room && discussionEnabled && !isRoomFederated(room) && (canStartDiscussion || canStartDiscussionOtherUser);

	const handleCreateDiscussion = () =>
		setModal(<CreateDiscussion onClose={() => setModal(null)} defaultParentRoom={room?.prid || room?._id} />);

	return { handleCreateDiscussion, allowDiscussion };
};
