import { isOmnichannelRoom, type IRoom } from '@rocket.chat/core-typings';
import { useRoute, useStream, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useOmnichannelCloseRoute } from '../../../../hooks/omnichannel/useOmnichannelCloseRoute';

export function useGoToHomeOnRemoved(room: IRoom, userId: string | undefined): void {
	const homeRouter = useRoute('home');
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const subscribeToNotifyUser = useStream('notify-user');
	const t = useTranslation();
	const { navigateHome } = useOmnichannelCloseRoute();

	useEffect(() => {
		if (!userId) {
			return;
		}

		const unSubscribeFromNotifyUser = subscribeToNotifyUser(`${userId}/subscriptions-changed`, (event, subscription) => {
			if (event === 'removed' && subscription.rid === room._id) {
				queryClient.invalidateQueries(['rooms', room._id]);

				if (isOmnichannelRoom(room)) {
					navigateHome();
					return;
				}

				dispatchToastMessage({
					type: 'info',
					message: t('You_have_been_removed_from__roomName_', {
						roomName: room?.fname || room?.name || '',
					}),
				});

				homeRouter.push({});
			}
		});

		return unSubscribeFromNotifyUser;
	}, [
		userId,
		homeRouter,
		subscribeToNotifyUser,
		room._id,
		room?.fname,
		room?.name,
		t,
		dispatchToastMessage,
		queryClient,
		room.t,
		room,
		navigateHome,
	]);
}
