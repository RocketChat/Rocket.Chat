import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Messages } from '../../../../app/models/client';
import { MessageAction } from '../../../../app/ui-utils/client';
import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { t } from '../../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../../../lib/toast';
import { useToggleFollowingThreadMutation } from '../../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';

export const useFollowMessageAction = (
	message: IMessage,
	{ room, user, context }: { room: IRoom; user: IUser | undefined; context: MessageActionContext },
) => {
	const threadsEnabled = useSetting('Threads_enabled');

	const toggleFollowingMutation = useToggleFollowingThreadMutation({
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('You_followed_this_message'),
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

		if (replies?.includes(user._id)) {
			return;
		}

		MessageAction.addButton({
			id: 'follow-message',
			icon: 'bell',
			label: 'Follow_message',
			type: 'interaction',
			context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			async action() {
				toggleFollowingMutation.mutate({ tmid: tmid || _id, follow: true, rid: room._id });
			},
			order: 1,
			group: 'menu',
		});

		return () => MessageAction.removeButton('follow-message');
	}, [context, message, room, threadsEnabled, toggleFollowingMutation, user]);
};
