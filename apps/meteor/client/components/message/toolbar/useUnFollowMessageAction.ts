import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';

import type { MessageActionContext, MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { t } from '../../../../app/utils/lib/i18n';
import { Messages } from '../../../stores';
import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';

export const useUnFollowMessageAction = (
	message: IMessage,
	{ room, context }: { room: IRoom; context: MessageActionContext },
): MessageActionConfig | null => {
	const user = useUser();
	const threadsEnabled = useSetting('Threads_enabled');

	const dispatchToastMessage = useToastMessageDispatch();

	const { mutate: toggleFollowingThread } = useToggleFollowingThreadMutation({
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('You_unfollowed_this_message'),
			});
		},
	});

	const { tmid, _id } = message;
	const parentMessage = Messages.use((state) => state.find((record) => record._id === tmid || record._id === _id));

	if (!message || !threadsEnabled || isOmnichannelRoom(room)) {
		return null;
	}

	let { replies } = message;

	if (tmid || context) {
		if (parentMessage) {
			replies = parentMessage.replies || [];
		}
	}

	if (!user?._id) {
		return null;
	}

	if (!replies?.includes(user._id)) {
		return null;
	}

	return {
		id: 'unfollow-message',
		icon: 'bell-off',
		label: 'Unfollow_message',
		type: 'interaction',
		context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		action() {
			toggleFollowingThread({ tmid: tmid || _id, follow: false, rid: room._id });
		},
		order: 1,
		group: 'menu',
	};
};
