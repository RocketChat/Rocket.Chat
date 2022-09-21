import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { lazy, useMemo } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';

addAction('game-center', () => {
	const getExternalComponents = useEndpoint('GET', '/apps/externalComponents');
	const result = useQuery(['apps/external-components'], () => getExternalComponents(), {
		staleTime: 10_000,
	});

	const template = lazy(() => import('./GameCenter'));

	return useMemo(
		() =>
			result.isSuccess && result.data.externalComponents.length > 0
				? {
						groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
						id: 'game-center',
						title: 'Apps_Game_Center',
						icon: 'game',
						template,
						order: -1,
				  }
				: null,
		[result.isSuccess, result?.data?.externalComponents, template],
	) as any;
});
