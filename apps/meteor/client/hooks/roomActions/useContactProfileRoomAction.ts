import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const ContactInfoRouter = lazy(() => import('../../views/omnichannel/contactInfo/ContactInfoRouter'));

export const useContactProfileRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'contact-profile',
			groups: ['live' /* , 'voip'*/],
			title: 'Contact_Info',
			icon: 'user',
			tabComponent: ContactInfoRouter,
			order: 1,
		}),
		[],
	);
};
