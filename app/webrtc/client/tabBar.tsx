import { useMemo } from 'react';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction } from '../../../client/views/room/lib/Toolbox';
import { useMethod } from '../../../client/contexts/ServerContext';

addAction('webRTCVideo', ({ room }) => {
	const enabled = useSetting('WebRTC_Enabled') && (useSetting('Omnichannel_call_provider') === 'WebRTC');
	const createSession = useMethod('webrtc:createSession');

	const handleClick = async (): Promise<void> => {
		const sessionId = await createSession(room._id);
		window.open(`/meet/${ sessionId }`, '_blank');
	};

	return useMemo(() => (enabled ? {
		groups: ['live'],
		id: 'webRTCVideo',
		title: 'WebRTC_Call',
		icon: 'phone',
		action: handleClick,
		full: true,
		order: 4,
	} : null), [enabled]);
});
