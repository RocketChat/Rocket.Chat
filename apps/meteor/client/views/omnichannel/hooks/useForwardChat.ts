import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LegacyRoomManager } from '../../../lib/LegacyRoomManager';
import type { ForwardChatInput } from '../lib/forwardChat';
import { buildForwardChatRequest } from '../lib/forwardChat';

/** Hands a chat over to a department or an agent, and takes the workspace out of the room once it is gone. */
export const useForwardChat = (room: IOmnichannelRoom) => {
	const { t } = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const getUserData = useEndpoint('GET', '/v1/users.info');
	const forwardChat = useEndpoint('POST', '/v1/livechat/room.forward');

	return useCallback(
		async ({ department: departmentId, username, comment }: ForwardChatInput): Promise<void> => {
			try {
				const userId = username ? (await getUserData({ username })).user?._id : undefined;
				const request = buildForwardChatRequest(room._id, { departmentId, userId, comment });

				if (!request) {
					return;
				}

				await forwardChat(request);
				dispatchToastMessage({ type: 'success', message: t('Transferred') });
				router.navigate('/home');
				LegacyRoomManager.close(room.t + room._id);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[room._id, room.t, getUserData, forwardChat, dispatchToastMessage, t, router],
	);
};
