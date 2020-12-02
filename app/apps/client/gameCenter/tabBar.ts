import { useMemo } from 'react';

import { useSetting } from '../../../../client/contexts/SettingsContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { addAction } from '../../../../client/channel/lib/Toolbox';

addAction('game-center', () => {
	const enabled = useSetting('Apps_Game_Center_enabled');

	const { data = { externalComponents: [] }, state, error } = useEndpointDataExperimental('/apps/externalComponents');

	const hasExternalComponents = data && data.externalComponents.length > 0;
	const hasError = !!error;
	return useMemo(() =>
		(enabled
		&& state === ENDPOINT_STATES.DONE
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
