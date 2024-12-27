import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, useSetting, usePermission, useSetModal } from '@rocket.chat/ui-contexts';

import CreateDiscussion from '../../../../../../components/CreateDiscussion';

export const useCreateDiscussionAction = (room?: IRoom): GenericMenuItemProps => {
	const t = useTranslation();
	const setModal = useSetModal();

	if (!room) {
		throw new Error('Invalid room');
	}

	const handleCreateDiscussion = () =>
		setModal(<CreateDiscussion onClose={() => setModal(null)} defaultParentRoom={room?.prid || room?._id} />);

	const discussionEnabled = useSetting('Discussion_enabled', true);
	const canStartDiscussion = usePermission('start-discussion', room._id);
	const canSstartDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);

	const allowDiscussion = room && discussionEnabled && !isRoomFederated(room) && (canStartDiscussion || canSstartDiscussionOtherUser);

	return {
		id: 'create-discussion',
		content: t('Discussion'),
		icon: 'discussion',
		disabled: !allowDiscussion,
		onClick: handleCreateDiscussion,
	};
};
