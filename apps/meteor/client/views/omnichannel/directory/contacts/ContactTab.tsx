import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ContactTable from './ContactTable';

const ContactTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ContactTable />;
	}

	return <NotAuthorizedPage />;
};

export default ContactTab;
