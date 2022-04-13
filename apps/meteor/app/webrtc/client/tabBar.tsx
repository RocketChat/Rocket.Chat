import { useMemo, useCallback } from 'react';
import { useSetting } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import { APIClient } from '../../utils/client';

addAction('webRTCVideo', ({ room }) => {
	const enabled = useSetting('WebRTC_Enabled') && useSetting('Omnichannel_call_provider') === 'WebRTC' && room.servedBy;

	const handleClick = useCallback(async (): Promise<void> => {
		if (!room.callStatus || room.callStatus === 'declined' || room.callStatus === 'ended') {
			await APIClient.v1.get('livechat/webrtc.call', { rid: room._id });
		}
		window.open(`/meet/${room._id}`, room._id);
	}, [room._id, room.callStatus]);

	return useMemo(
		() =>
			enabled
				? {
						groups: ['live'],
						id: 'webRTCVideo',
						title: 'WebRTC_Call',
						icon: 'phone',
						action: handleClick,
						full: true,
						order: 4,
				  }
				: null,
		[enabled, handleClick],
	);
});
