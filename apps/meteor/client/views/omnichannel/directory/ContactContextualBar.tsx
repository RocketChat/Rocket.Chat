import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import ContactInfo from '../contactInfo/ContactInfo';
import ContactInfoError from '../contactInfo/ContactInfoError';
import EditContactInfo from '../contactInfo/EditContactInfo';
import EditContactInfoWithData from '../contactInfo/EditContactInfoWithData';

const ContactContextualBar = () => {
	const directoryRoute = useRoute('omnichannel-directory');
	const contactId = useRouteParameter('id');
	const context = useRouteParameter('context');

	const handleClose = () => {
		directoryRoute.push({ tab: 'contacts' });
	};

	const handleCancel = () => contactId && directoryRoute.push({ tab: 'contacts', context: 'details', id: contactId });

	if (!contactId) {
		return <ContactInfoError onClose={handleClose} />;
	}

	if (context === 'edit' && contactId) {
		return <EditContactInfoWithData id={contactId} onClose={handleClose} onCancel={handleCancel} />;
	}

	if (context === 'new') {
		return <EditContactInfo onClose={handleClose} onCancel={handleClose} />;
	}

	return <ContactInfo id={contactId} onClose={handleClose} />;
};

export default ContactContextualBar;
