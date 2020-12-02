import { useMemo } from 'react';

import { useSetting } from '../../../client/contexts/SettingsContext';
import { addAction } from '../../../client/channel/lib/Toolbox';

addAction('livestream', ({ room }) => {
	const enabled = useSetting('Livestream_enabled');

	const isLive = room && room.streamingOptions && room.streamingOptions.id && room.streamingOptions.type === 'livestream';

	return useMemo(() => (enabled ? {
		groups: ['channel', 'group'],
		id: 'livestream',
		title: 'Livestream',
		icon: 'podcast',
		template: 'liveStreamTab',
		order: isLive ? 15 : -1,
		// class: () => live && 'live',
	} : null), [isLive, enabled]);
});
