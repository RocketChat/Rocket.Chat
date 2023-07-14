import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const CallsContextualBarRoom = lazy(() => import('../../views/omnichannel/directory/calls/contextualBar/CallsContextualBarRoom'));

export const useVoIPRoomInfoRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('voip-room-info', {
			groups: ['voip'],
			id: 'voip-room-info',
			title: 'Call_Information',
			icon: 'info-circled',
			template: CallsContextualBarRoom,
			order: 0,
		});
	}, []);
};
