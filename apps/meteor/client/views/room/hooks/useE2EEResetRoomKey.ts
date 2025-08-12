import type { RoomID } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { e2e } from '../../../../app/e2e/client';

type UseE2EEResetRoomKeyVariables = {
	roomId: RoomID;
};

export const useE2EEResetRoomKey = (
	options?: Omit<UseMutationOptions<void, Error, UseE2EEResetRoomKeyVariables>, 'mutationFn'>,
): UseMutationResult<void, Error, UseE2EEResetRoomKeyVariables> => {
	const resetRoomKey = useEndpoint('POST', '/v1/e2e.resetRoomKey');

	return useMutation({
		mutationFn: async ({ roomId }) => {
			const e2eRoom = await e2e.getInstanceByRoomId(roomId);
			if (!e2eRoom) {
				throw new Error('Cannot reset room key');
			}

			const { e2eKey, e2eKeyId } = (await e2eRoom.resetRoomKey()) ?? {};

			if (!e2eKey || !e2eKeyId) {
				throw new Error('Cannot reset room key');
			}

			try {
				await resetRoomKey({ rid: roomId, e2eKeyId, e2eKey });
			} catch (error) {
				throw error;
			}
		},

		...options,
	});
};
