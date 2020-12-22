import { useMemo } from 'react';

import { useSetting } from '../../../../client/contexts/SettingsContext';
import { addAction } from '../../../../client/views/room/lib/Toolbox';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';

addAction('game-center', () => {
	const enabled = useSetting('Apps_Game_Center_enabled');

	const { value = { externalComponents: [] }, phase: state, error } = useEndpointData('/apps/externalComponents');

	const hasExternalComponents = value && value.externalComponents.length > 0;
	const hasError = !!error;
	return useMemo(() =>
		(enabled
		&& state === AsyncStatePhase.LOADING
		&& !hasError
		&& hasExternalComponents
			? {
				groups: ['channel', 'group', 'direct'],
				id: 'game-center',
				title: 'Apps_Game_Center',
				icon: 'game',
				template: 'GameCenter',
				order: -1,
			} : null), [enabled, hasError, hasExternalComponents, state]);
});
