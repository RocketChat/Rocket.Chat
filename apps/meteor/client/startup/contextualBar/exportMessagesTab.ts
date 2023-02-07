import { usePermission } from '@rocket.chat/ui-contexts';
import type { LazyExoticComponent, FC } from 'react';
import { useMemo, lazy } from 'react';

import { addAction } from '../../views/room/lib/Toolbox';

addAction('export-messages', ({ room }) => {
	const hasPermission = usePermission('mail-messages', room._id);
	return useMemo(
		() =>
			hasPermission
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'export-messages',
						anonymous: true,
						title: 'Export_Messages',
						icon: 'mail',
						template: lazy(() => import('../../views/room/contextualBar/ExportMessages')) as LazyExoticComponent<FC>,
						full: true,
						order: 12,
				  }
				: null,
		[hasPermission],
	);
});
