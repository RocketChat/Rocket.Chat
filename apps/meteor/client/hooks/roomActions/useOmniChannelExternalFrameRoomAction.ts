import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const ExternalFrameContainer = lazy(() => import('../../../app/livechat/client/externalFrame/ExternalFrameContainer'));

export const useOmniChannelExternalFrameRoomAction = () => {
	const enabled = useSetting('Omnichannel_External_Frame_Enabled', false);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return ui.addRoomAction('omnichannel-external-frame', {
			groups: ['live'],
			id: 'omnichannel-external-frame',
			title: 'Omnichannel_External_Frame',
			icon: 'cube',
			template: ExternalFrameContainer,
			order: -1,
		});
	}, [enabled]);
};
