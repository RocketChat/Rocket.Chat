import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { MoveDiscussion } from '../../MoveDiscussion';

export const useMoveDiscussionAction = (message: IMessage) => {
	const setModal = useSetModal();
	const userId = useMemo(() => Meteor.userId(), []);
	const canMoveDiscussion = usePermission('move-discussion', userId || '');

	const { drid } = message;

	const userOwnsMessage = message.u._id === userId;

	if (!userId || !drid || !(canMoveDiscussion || userOwnsMessage)) {
		return null;
	}

	return {
		id: 'move-discussion',
		icon: 'balloon-arrow-left',
		label: 'Move_Discussion_title',
		type: 'communication',
		context: ['message', 'message-mobile', 'videoconf'],
		async action() {
			setModal(<MoveDiscussion message={message} onClose={() => setModal(undefined)} />);
		},
		order: 1,
		group: 'menu',
	};
};
