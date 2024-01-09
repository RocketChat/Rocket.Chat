import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useTranslation, useSetting, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import CreateDiscussion from '../../../../../../components/CreateDiscussion';
import type { ToolbarAction } from './ToolbarAction';

export const useCreateDiscussionAction = (room?: IRoom): ToolbarAction => {
	if (!room) {
		throw new Error('Invalid room');
	}

	const setModal = useSetModal();
	const t = useTranslation();

	const handleCreateDiscussion = () =>
		setModal(<CreateDiscussion onClose={() => setModal(null)} defaultParentRoom={room?.prid || room?._id} />);

	const discussionEnabled = useSetting('Discussion_enabled') as boolean;
	const canStartDiscussion = usePermission('start-discussion', room._id);
	const canSstartDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);

	const allowDiscussion = room && discussionEnabled && !isRoomFederated(room) && (canStartDiscussion || canSstartDiscussionOtherUser);

	return {
		id: 'create-discussion',
		title: !allowDiscussion ? t('Not_Available') : undefined,
		disabled: !allowDiscussion,
		onClick: handleCreateDiscussion,
		icon: 'discussion',
		label: t('Discussion'),
	};
};
