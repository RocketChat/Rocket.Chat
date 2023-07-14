import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const ContactsContextualBar = lazy(() => import('../../views/omnichannel/directory/contacts/contextualBar/ContactsContextualBar'));

export const useContactProfileRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('contact-profile', {
			groups: ['live' /* , 'voip'*/],
			id: 'contact-profile',
			title: 'Contact_Info',
			icon: 'user',
			template: ContactsContextualBar,
			order: 1,
		});
	}, []);
};
