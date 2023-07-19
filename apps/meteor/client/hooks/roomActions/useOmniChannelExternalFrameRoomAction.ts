import { useSetting } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import type { ToolboxAction } from '../../views/room/lib/Toolbox';

const ExternalFrameContainer = lazy(() => import('../../../app/livechat/client/externalFrame/ExternalFrameContainer'));

export const useOmniChannelExternalFrameRoomAction = (): ToolboxAction | undefined => {
	const enabled = useSetting('Omnichannel_External_Frame_Enabled', false);

	return useMemo(() => {
		if (!enabled) {
			return undefined;
		}

		return {
			id: 'omnichannel-external-frame',
			groups: ['live'],
			title: 'Omnichannel_External_Frame',
			icon: 'cube',
			template: ExternalFrameContainer,
			order: -1,
		};
	}, [enabled]);
};
