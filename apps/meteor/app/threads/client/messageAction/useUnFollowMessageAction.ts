import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { dispatchToastMessage } from '../../../../client/lib/toast';
import { useToggleFollowingThreadMutation } from '../../../../client/views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import { Messages } from '../../../models/client';
import { MessageAction } from '../../../ui-utils/client';
import type { MessageActionContext } from '../../../ui-utils/client/lib/MessageAction';
import { t } from '../../../utils/lib/i18n';

export const useUnFollowMessageAction = (
	message: IMessage,
	{ room, user, context }: { room: IRoom; user: IUser | undefined; context: MessageActionContext },
) => {
	const threadsEnabled = useSetting('Threads_enabled');

	const toggleFollowingMutation = useToggleFollowingThreadMutation({
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('You_unfollowed_this_message'),
			});
		},
	});
	useEffect(() => {
		if (!message || !threadsEnabled || isOmnichannelRoom(room)) {
			return;
		}

		const { tmid, _id } = message;
		let { replies } = message;

		if (tmid || context) {
			const parentMessage = Messages.findOne({ _id: tmid || _id }, { fields: { replies: 1 } });
			if (parentMessage) {
				replies = parentMessage.replies || [];
			}
		}

		if (!user?._id) {
			return;
		}

		if (!replies?.includes(user._id)) {
			return;
		}

		MessageAction.addButton({
			id: 'unfollow-message',
			icon: 'bell-off',
			label: 'Unfollow_message',
			type: 'interaction',
			context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			async action() {
				toggleFollowingMutation.mutate({ tmid: tmid || _id, follow: false, rid: room._id });
			},
			order: 1,
			group: 'menu',
		});

		return () => MessageAction.removeButton('unfollow-message');
	}, [context, message, room, threadsEnabled, toggleFollowingMutation, user]);
};
