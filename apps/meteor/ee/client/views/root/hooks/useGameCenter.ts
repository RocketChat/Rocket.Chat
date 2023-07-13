import { lazy, useEffect } from 'react';

import { ui } from '../../../../../client/lib/ui';
import { useExternalComponentsQuery } from '../../../apps/gameCenter/hooks/useExternalComponentsQuery';

const GameCenter = lazy(() => import('../../../apps/gameCenter/GameCenter'));

export const useGameCenter = () => {
	const result = useExternalComponentsQuery();
	const hasGameCenter = result.isSuccess && result.data.length > 0;

	useEffect(() => {
		if (!hasGameCenter) {
			return;
		}

		return ui.addRoomAction('game-center', () => {
			return {
				groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
				id: 'game-center',
				title: 'Apps_Game_Center',
				icon: 'game',
				template: GameCenter,
				order: -1,
			};
		});
	}, [hasGameCenter]);
};
