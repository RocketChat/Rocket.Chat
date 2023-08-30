import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const ContactsContextualBar = lazy(() => import('../../views/omnichannel/directory/contacts/contextualBar/ContactsContextualBar'));

export const useContactProfileRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'contact-profile',
			groups: ['live' /* , 'voip'*/],
			title: 'Contact_Info',
			icon: 'user',
			tabComponent: ContactsContextualBar,
			order: 1,
		}),
		[],
	);
};
