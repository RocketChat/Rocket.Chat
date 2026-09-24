import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';

import CreateDiscussion from '../../../../../../components/CreateDiscussion';
import { useComposerCapabilities } from '../../../ComposerCapabilitiesContext';

export const useCreateDiscussionAction = (disabled: boolean, room?: IRoom): GenericMenuItemProps => {
	const t = useTranslation();
	const setModal = useSetModal();

	if (!room) {
		throw new Error('Invalid room');
	}

	const handleCreateDiscussion = () =>
		setModal(
			<CreateDiscussion onClose={() => setModal(null)} defaultParentRoom={room?.prid || room?._id} encryptedParentRoom={room?.encrypted} />,
		);

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
