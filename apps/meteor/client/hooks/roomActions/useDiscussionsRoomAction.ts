import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';

const Discussions = lazy(() => import('../../views/room/contextualBar/Discussions'));

export const useDiscussionsRoomAction = () => {
	const room = useRoom();
	const federated = isRoomFederated(room);
	const enabled = useSetting('Discussion_enabled', false);
	const { t } = useTranslation();

	useEffect(() => {
		if (!enabled || !!room.prid) {
			return;
		}

		return ui.addRoomAction('discussions', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
			id: 'discussions',
			title: 'Discussions',
			icon: 'discussion',
			template: Discussions,
			full: true,
			...(federated && {
				disabled: true,
				tooltip: t('core.Discussions_unavailable_for_federation'),
			}),
			order: 3,
		});
	}, [enabled, federated, room.prid, t]);
};
