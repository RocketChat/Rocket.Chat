import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useUnstarMessageMutation } from '../hooks/useUnstarMessageMutation';

export const useUnstarMessageAction = (message: IMessage, { room }: { room: IRoom }): MessageActionConfig | null => {
	const user = useUser();
	const allowStarring = useSetting('Message_AllowStarring');

	const { mutateAsync: unstarMessage } = useUnstarMessageMutation();

	if (!allowStarring || isOmnichannelRoom(room)) {
		return null;
	}

	if (!Array.isArray(message.starred) || message.starred.every((star) => star._id !== user?._id)) {
		return null;
	}

	return {
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		type: 'interaction',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action() {
			await unstarMessage(message);
		},
		order: 3,
		group: 'menu',
	};
};
