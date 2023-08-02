import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

export const useWebRTCVideoRoomAction = () => {
	const enabled = useSetting('WebRTC_Enabled', false);
	const room = useRoom();
	const federated = isRoomFederated(room);
	const callProvider = useSetting<string>('Omnichannel_call_provider', 'default-provider');

	const allowed = enabled && callProvider === 'WebRTC' && room.servedBy;

	const { t } = useTranslation();

	const handleClick = useCallback(async () => {
		if (!room.callStatus || room.callStatus === 'declined' || room.callStatus === 'ended') {
			await sdk.rest.get('/v1/livechat/webrtc.call', { rid: room._id });
		}
		window.open(`/meet/${room._id}`, room._id);
	}, [room._id, room.callStatus]);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!allowed) {
			return undefined;
		}

		return {
			id: 'webRTCVideo',
			groups: ['live'],
			title: 'WebRTC_Call',
			icon: 'phone',
			...(federated && {
				tooltip: t('core.Call_unavailable_for_federation'),
				disabled: true,
			}),
			action: () => void handleClick(),
			full: true,
			order: 4,
		};
	}, [allowed, federated, handleClick, t]);
};
