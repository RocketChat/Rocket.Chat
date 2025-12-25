import { useRouteParameter } from '@rocket.chat/ui-contexts';

import ContactInfo from '../contactInfo/ContactInfo';
import ContactInfoError from '../contactInfo/ContactInfoError';
import EditContactInfo from '../contactInfo/EditContactInfo';
import EditContactInfoWithData from '../contactInfo/EditContactInfoWithData';
import { useOmnichannelDirectoryRouter } from './hooks/useOmnichannelDirectoryRouter';

const ContactContextualBar = () => {
	const contactId = useRouteParameter('id');
	const context = useRouteParameter('context');
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();

	const handleClose = () => omnichannelDirectoryRouter.navigate({ tab: 'contacts' });

	const handleCancel = () => {
		if (!contactId) {
			return;
		}

		return omnichannelDirectoryRouter.navigate({ tab: 'contacts', context: 'details', id: contactId });
	};

	if (context === 'edit' && contactId) {
		return <EditContactInfoWithData id={contactId} onClose={handleClose} onCancel={handleCancel} />;
	}

	if (context === 'new' && !contactId) {
		return <EditContactInfo onClose={handleClose} onCancel={handleClose} />;
	}

	if (!contactId) {
		return <ContactInfoError onClose={handleClose} />;
	}

	return <ContactInfo id={contactId} onClose={handleClose} />;
};

export default ContactContextualBar;
