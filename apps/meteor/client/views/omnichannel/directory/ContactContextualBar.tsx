import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import ContactInfo from '../contactInfo/ContactInfo';
import EditContactInfo from '../contactInfo/EditContactInfo';
import EditContactInfoWithData from '../contactInfo/EditContactInfoWithData';

const ContactContextualBar = () => {
	const directoryRoute = useRoute('omnichannel-directory');
	const contactId = useRouteParameter('id') || '';
	const context = useRouteParameter('context');

	const handleClose = () => {
		directoryRoute.push({ tab: 'contacts' });
	};

	const handleCancel = () => {
		directoryRoute.push({ tab: 'contacts', context: 'details', id: contactId });
	};

	if (context === 'new') {
		return <EditContactInfo id={contactId} onClose={handleClose} onCancel={handleClose} />;
	}

	if (context === 'edit') {
		return <EditContactInfoWithData id={contactId} onClose={handleClose} onCancel={handleCancel} />;
	}

	return <ContactInfo id={contactId} onClose={handleClose} />;
};

export default ContactContextualBar;
