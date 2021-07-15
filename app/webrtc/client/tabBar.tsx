import { useMemo } from 'react';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('webRTCVideo', () => {
	const enabled = useSetting('WebRTC_Enabled') && (useSetting('Omnichannel_call_provider') === 'WebRTC');

	const handleClick = (): void => { window.open('/', '_blank'); };

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
