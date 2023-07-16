import { isRoomFederated } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import otr from '../../../app/otr/client/OTR';
import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';

const OTR = lazy(() => import('../../views/room/contextualBar/OTR'));

export const useOTRRoomAction = () => {
	const enabled = useSetting('OTR_Enable', false);
	const room = useRoom();
	const federated = isRoomFederated(room);
	const capable = !!global.crypto;
	const { t } = useTranslation();

	useEffect(() => {
		otr.setEnabled(enabled && capable);
	}, [enabled, capable]);

	useEffect(() => {
		if (!enabled || !capable) {
			return;
		}

		return ui.addRoomAction('otr', {
			groups: ['direct'],
			id: 'otr',
			title: 'OTR',
			icon: 'stopwatch',
			template: OTR,
			order: 13,
			full: true,
			...(federated && {
				tooltip: t('core.OTR_unavailable_for_federation'),
				disabled: true,
			}),
		});
	}, [capable, enabled, federated, t]);
};
