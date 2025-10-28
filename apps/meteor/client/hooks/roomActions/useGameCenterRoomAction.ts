import { lazy, useMemo } from 'react';

import { useExternalComponentsQuery } from '../../apps/gameCenter/hooks/useExternalComponentsQuery';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const GameCenter = lazy(() => import('../../apps/gameCenter/GameCenter'));

export const useGameCenterRoomAction = () => {
	const result = useExternalComponentsQuery();
	const enabled = result.isSuccess && result.data.length > 0;

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'game-center',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Apps_Game_Center',
			icon: 'game',
			tabComponent: GameCenter,
			order: -1,
		};
	}, [enabled]);
};
