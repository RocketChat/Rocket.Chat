import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';

export const useWebRTCVideoRoomAction = () => {
	const enabled = useSetting('WebRTC_Enabled', false);
	const room = useRoom();
	const federated = isRoomFederated(room);
	const callProvider = useSetting<string>('Omnichannel_call_provider', 'default-provider');

	const allowed = enabled && callProvider === 'WebRTC' && room.servedBy;

	const handleClick = useCallback(async () => {
		if (!room.callStatus || room.callStatus === 'declined' || room.callStatus === 'ended') {
			await sdk.rest.get('/v1/livechat/webrtc.call', { rid: room._id });
		}
		window.open(`/meet/${room._id}`, room._id);
	}, [room._id, room.callStatus]);

	useEffect(() => {
		if (!allowed) {
			return;
		}

		return ui.addRoomAction('webRTCVideo', {
			groups: ['live'],
			id: 'webRTCVideo',
			title: 'WebRTC_Call',
			icon: 'phone',
			...(federated && {
				'data-tooltip': 'Call_unavailable_for_federation',
				'disabled': true,
			}),
			action: () => void handleClick(),
			full: true,
			order: 4,
		});
	}, [allowed, federated, handleClick]);
};
