import { useMemo } from 'react';

import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';

addAction('game-center', () => {
	const { value = { externalComponents: [] }, phase: state, error } = useEndpointData('/apps/externalComponents');

	const hasExternalComponents = value && value.externalComponents.length > 0;
	const hasError = !!error;
	return useMemo(() =>
		(state === AsyncStatePhase.RESOLVED
		&& !hasError
		&& hasExternalComponents
			? {
				groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
				id: 'game-center',
				title: 'Apps_Game_Center',
				icon: 'game',
				template: 'GameCenter',
				order: -1,
			} : null), [hasError, hasExternalComponents, state]);
});
