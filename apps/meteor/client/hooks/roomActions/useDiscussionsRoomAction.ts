import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../views/room/lib/Toolbox';

const Discussions = lazy(() => import('../../views/room/contextualBar/Discussions'));

export const useDiscussionsRoomAction = (): ToolboxActionConfig | undefined => {
	const room = useRoom();
	const federated = isRoomFederated(room);
	const enabled = useSetting('Discussion_enabled', false);
	const { t } = useTranslation();

	return useMemo(() => {
		if (!enabled || !!room.prid) {
			return undefined;
		}

		return {
			id: 'discussions',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			title: 'Discussions',
			icon: 'discussion',
			template: Discussions,
			full: true,
			...(federated && {
				disabled: true,
				tooltip: t('core.Discussions_unavailable_for_federation'),
			}),
			order: 3,
		};
	}, [enabled, federated, room.prid, t]);
};
