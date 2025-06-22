import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useTranslation, useSetting, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import { MoveDiscussion } from '../../MoveDiscussion';

export const useMoveDiscussionAction = (message: IMessage) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const { drid } = message;
	if (!drid) {
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
