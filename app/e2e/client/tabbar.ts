import { useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { addAction } from '../../../client/channel/lib/Toolbox';
import { useSetting } from '../../../client/contexts/SettingsContext';
import { usePermission } from '../../../client/contexts/AuthorizationContext';
import { useMethod } from '../../../client/contexts/ServerContext';

addAction('e2e', ({ room }) => {
	const e2eEnabled = useSetting('E2E_Enable');
	const hasPermission = usePermission('edit-room', room._id);
	const toggleE2E = useMethod('saveRoomSettings');

	const action = useMutableCallback(() => {
		toggleE2E(room._id, 'encrypted', !room.encrypted);
	});

	// class: () => (ChatRoom.findOne(Session.get('openedRoom')) || {}).encrypted && 'enabled', todo add render

	return useMemo(() => (e2eEnabled && hasPermission ? {
		groups: ['direct', 'group'],
		id: 'e2e',
		title: 'E2E',
		icon: 'key',
		order: 13,
		action,
	} : null), [action, e2eEnabled, hasPermission]);
});
