import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';

export const useMarkAsUnreadMutation = () => {
	const dispatchToastMessage = useToastMessageDispatch();
	const unreadMessages = useEndpoint('POST', '/v1/subscriptions.unread');

	return useMutation({
		mutationFn: async ({
			subscription,
			...props
		}:
			| { message: IMessage; subscription: ISubscription }
			| {
					roomId: string;
					subscription: ISubscription;
			  }) => {
			await LegacyRoomManager.close(subscription.t + subscription.name);
			if ('message' in props) {
				const { message } = props;
				await unreadMessages({ firstUnreadMessage: { _id: message._id } });
				return;
			}
			await unreadMessages({ roomId: props.roomId });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
