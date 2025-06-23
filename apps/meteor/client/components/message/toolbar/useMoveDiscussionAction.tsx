import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { MoveDiscussion } from '../../MoveDiscussion';
import { usePermission } from '@rocket.chat/ui-contexts';

export const useMoveDiscussionAction = (message: IMessage, userId: IUser['_id']) => {
	const setModal = useSetModal();

	const { drid } = message;
	const canMoveDiscussion = usePermission('move-discussion', userId);
	const userOwnsMessage = message.u._id === userId;

	if (!drid || !(canMoveDiscussion || userOwnsMessage)) {
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
