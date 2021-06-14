import { useMemo, lazy, LazyExoticComponent, FC } from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
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
						template: lazy(
							() => import('../../views/room/contextualBar/ExportMessages'),
						) as LazyExoticComponent<FC>,
						full: true,
						order: 12,
				  }
				: null,
		[hasPermission],
	);
});
