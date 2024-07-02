import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import ContactInfo from '../../contactInfo/ContactInfo';
import EditContactInfo from '../../contactInfo/EditContactInfo';
import EditContactInfoWithData from '../../contactInfo/EditContactInfoWithData';
import ContactHistoryMessagesList from '../../contactInfo/contactHistory/MessageList/ContactHistoryMessagesList';

const ContactContextualBar = () => {
	const bar = useRouteParameter('bar');
	const directoryRoute = useRoute('omnichannel-directory');
	const contactId = useRouteParameter('id') || '';

	const handleClose = () => directoryRoute.push({ page: 'contacts' });

	const handleCancel = () => {
		if (contactId) {
			return directoryRoute.push({ page: 'contacts', id: contactId, bar: 'info' });
		}

		return directoryRoute.push({ page: 'contacts' });
	};

	if (bar === 'chat-history' && contactId) {
		return <ContactHistoryMessagesList chatId={contactId} onClose={handleClose} />;
	}

	if (bar === 'new') {
		return <EditContactInfo onClose={handleClose} onCancel={handleCancel} />;
	}

	if (bar === 'edit') {
		return <EditContactInfoWithData id={contactId} onClose={handleClose} onCancel={handleCancel} />;
	}

	return <ContactInfo id={contactId} onClose={handleClose} />;
};

export default ContactContextualBar;
