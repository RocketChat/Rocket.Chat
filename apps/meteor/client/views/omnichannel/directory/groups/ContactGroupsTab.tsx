import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ContactGroupsTable from './ContactGroupsTable';

const ContactGroupsTab = () => {
	// TODO: should we have this permission??
	// const hasAccess = usePermission('view-l-room');

	// if (hasAccess) {
	// 	return <ContactTable />;
	// }

	// return <NotAuthorizedPage />;
	return <ContactGroupsTable />;
};

export default ContactGroupsTab;
