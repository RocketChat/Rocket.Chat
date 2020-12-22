
import { useMemo } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';

addAction('clean-history', ({ room }) => {
	const hasPermission = usePermission('clean-channel-history', room._id);
	return useMemo(() => (hasPermission ? {
		groups: ['channel', 'group', 'direct'],
		id: 'clean-history',
		anonymous: true,
		title: 'Prune_Messages',
		icon: 'eraser',
		template: 'cleanHistory',
		order: 250,
	} : null), [hasPermission]);
});
