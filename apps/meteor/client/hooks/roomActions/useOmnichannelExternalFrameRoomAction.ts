import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const ExternalFrameContainer = lazy(() => import('../../../app/livechat/client/externalFrame/ExternalFrameContainer'));

export const useOmnichannelExternalFrameRoomAction = () => {
	const enabled = useSetting('Omnichannel_External_Frame_Enabled', false);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'omnichannel-external-frame',
			groups: ['live'],
			title: 'Omnichannel_External_Frame',
			icon: 'cube',
			tabComponent: ExternalFrameContainer,
			order: -1,
		};
	}, [enabled]);
};
