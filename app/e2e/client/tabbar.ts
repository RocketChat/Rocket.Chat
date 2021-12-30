import { useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { addAction } from '../../../client/views/room/lib/Toolbox';
import { usePermission } from '../../../client/contexts/AuthorizationContext';
import { useMethod } from '../../../client/contexts/ServerContext';
import { useE2EECapabilities } from '../../../client/views/e2ee/useE2EECapabilities';
import { useE2EEFlags } from '../../../client/views/e2ee/useE2EEFlags';

addAction('e2e', ({ room }) => {
	const { canEncrypt } = useE2EECapabilities();
	const { active } = useE2EEFlags();
	const canToggleE2e = usePermission('toggle-room-e2e-encryption', room._id);
	const canEditRoom = usePermission('edit-room', room._id);
	const hasPermission = (room.t === 'd' || (canEditRoom && canToggleE2e)) && canEncrypt;

	const toggleE2E = useMethod('saveRoomSettings');

	const action = useMutableCallback(() => {
		toggleE2E(room._id, 'encrypted', !room.encrypted);
	});

	const enabledOnRoom = !!room.encrypted;

	return useMemo(
		() =>
			active && hasPermission
				? {
						groups: ['direct', 'direct_multiple', 'group', 'team'],
						id: 'e2e',
						title: enabledOnRoom ? 'E2E_disable' : 'E2E_enable',
						icon: 'key',
						order: 13,
						action,
				  }
				: null,
		[action, active, enabledOnRoom, hasPermission],
	);
});
