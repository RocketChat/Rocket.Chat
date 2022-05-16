import { useMemo, lazy } from 'react';
import { usePermission } from '@rocket.chat/ui-contexts';

import { addAction } from '../../../../client/views/room/lib/Toolbox';

const template = lazy(() => import('../../../../client/views/room/contextualBar/PruneMessages'));

addAction('clean-history', ({ room }) => {
	const hasPermission = usePermission('clean-channel-history', room._id);
	return useMemo(
		() =>
			hasPermission
				? {
						groups: ['channel', 'group', 'team', 'direct_multiple', 'direct'],
						id: 'clean-history',
						full: true,
						title: 'Prune_Messages',
						icon: 'eraser',
						template,
						order: 250,
				  }
				: null,
		[hasPermission],
	);
});
