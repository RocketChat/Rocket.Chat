import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Option, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation, useSetting, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import CreateDiscussion from '../../../../../../components/CreateDiscussion';

const CreateDiscussionAction = ({ room }: { room: IRoom }) => {
	const setModal = useSetModal();
	const t = useTranslation();

	const handleCreateDiscussion = () =>
		setModal(<CreateDiscussion onClose={() => setModal(null)} defaultParentRoom={room?.prid || room?._id} />);

	const discussionEnabled = useSetting('Discussion_enabled') as boolean;
	const canStartDiscussion = usePermission('start-discussion');
	const canSstartDiscussionOtherUser = usePermission('start-discussion-other-user');

	const allowDiscussion = room && discussionEnabled && !isRoomFederated(room) && (canStartDiscussion || canSstartDiscussionOtherUser);

	return (
		<Option {...(!allowDiscussion && { title: t('Not_Available') })} disabled={!allowDiscussion} onClick={handleCreateDiscussion}>
			<OptionIcon name='discussion' />
			<OptionContent>{t('Discussion')}</OptionContent>
		</Option>
	);
};

export default CreateDiscussionAction;
