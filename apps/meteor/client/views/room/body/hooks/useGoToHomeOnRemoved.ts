import { isOmnichannelRoom, type IRoom } from '@rocket.chat/core-typings';
import { useRouter, useStream, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelCloseRoute } from '../../../../hooks/omnichannel/useOmnichannelCloseRoute';

export function useGoToHomeOnRemoved(room: IRoom, userId?: string): void {
	const router = useRouter();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const subscribeToNotifyUser = useStream('notify-user');
	const { t } = useTranslation();
	const { navigateHome } = useOmnichannelCloseRoute();

	useEffect(() => {
		if (!userId) {
			return;
		}

		return subscribeToNotifyUser(`${userId}/subscriptions-changed`, (event, subscription) => {
			if (event === 'removed' && subscription.rid === room._id) {
				queryClient.invalidateQueries({
					queryKey: ['rooms', room._id],
				});

				if (isOmnichannelRoom({ t: room.t })) {
					navigateHome();
					return;
				}

				dispatchToastMessage({
					type: 'info',
					message: t('You_have_been_removed_from__roomName_', {
						roomName: room?.fname || room?.name || '',
					}),
				});

				router.navigate('/home');
			}
		});
	}, [
		userId,
		router,
		subscribeToNotifyUser,
		room._id,
		room.t,
		room?.fname,
		room?.name,
		t,
		dispatchToastMessage,
		queryClient,
		navigateHome,
	]);
}
