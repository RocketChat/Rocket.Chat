import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';

export const useMarkAsUnreadMutation = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async ({ message, subscription }: { message: IMessage; subscription: ISubscription }) => {
			await LegacyRoomManager.close(subscription.t + subscription.name);
			await sdk.call('unreadMessages', message);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
