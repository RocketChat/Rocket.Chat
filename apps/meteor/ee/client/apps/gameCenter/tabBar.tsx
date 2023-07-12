import { lazy, useMemo } from 'react';

import { ui } from '../../../../client/lib/ui';
import { useExternalComponentsQuery } from './hooks/useExternalComponentsQuery';

ui.addRoomAction('game-center', () => {
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
