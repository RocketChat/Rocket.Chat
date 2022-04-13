import React from 'react';

import { usePermission } from '../../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';
import ContactTable from './ContactTable';

function ContactTab(props) {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ContactTable {...props} />;
	}

	return <NotAuthorizedPage />;
}

export default ContactTab;
