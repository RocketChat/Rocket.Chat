import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { useErrorToast } from './useErrorToast';
import { useExperimentalEndpoint } from '../../../../hooks/useExperimentalEndpoint';
import { isUnreadRoom } from '../../../hooks/useRoomList';

const READ_MANY_CHUNK_SIZE = 500;

export const useMarkFilterAsRead = () => {
	const readMany = useExperimentalEndpoint('POST', '/experimental/subscriptions.readMany');
	const onError = useErrorToast();

	return useMutation({
		mutationFn: async (rooms: SubscriptionWithRoom[]) => {
			const roomIds = rooms.filter(isUnreadRoom).map(({ rid }) => rid);

			for (let start = 0; start < roomIds.length; start += READ_MANY_CHUNK_SIZE) {
				await readMany({ roomIds: roomIds.slice(start, start + READ_MANY_CHUNK_SIZE) });
			}
		},
		onError,
	});
};
