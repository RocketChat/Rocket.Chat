import { lazy, useMemo } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { useExternalComponentsQuery } from './hooks/useExternalComponentsQuery';

addAction('game-center', () => {
	const result = useExternalComponentsQuery();

	const template = lazy(() => import('./GameCenter'));

	return useMemo(
		() =>
			result.isSuccess && result.data.length > 0
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'game-center',
						title: 'Apps_Game_Center',
						icon: 'game',
						template,
						order: -1,
				  }
				: null,
		[result.isSuccess, result?.data, template],
	) as any;
});
