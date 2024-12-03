import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useReactiveQuery } from '../../../../client/hooks/useReactiveQuery';
import { roomsQueryKeys } from '../../../../client/lib/queryKeys';
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

	const dispatchToastMessage = useToastMessageDispatch();

	const queryClient = useQueryClient();

	const { mutate: toggleFollowingThread } = useToggleFollowingThreadMutation({
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('You_unfollowed_this_message'),
			});
		},
	});

	const { tmid, _id } = message;
	const messageQuery = useReactiveQuery(
		roomsQueryKeys.message(message.rid, message._id),
		() => Messages.findOne({ _id: tmid || _id }, { fields: { replies: 1 } }) ?? null,
	);

	useEffect(() => {
		if (!message || !threadsEnabled || isOmnichannelRoom(room)) {
			return;
		}

		let { replies } = message;

		if (tmid || context) {
			const parentMessage = messageQuery.data;
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
				toggleFollowingThread({ tmid: tmid || _id, follow: false, rid: room._id });
				await queryClient.invalidateQueries(roomsQueryKeys.message(message.rid, message._id));
			},
			order: 1,
			group: 'menu',
		});

		return () => MessageAction.removeButton('unfollow-message');
	}, [_id, context, message, messageQuery.data, room, threadsEnabled, tmid, toggleFollowingThread, user]);
};
