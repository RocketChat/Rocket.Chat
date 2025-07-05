import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';

import ContactInfo from '../contactInfo/ContactInfo';
import ContactInfoError from '../contactInfo/ContactInfoError';
import EditContactInfo from '../contactInfo/EditContactInfo';
import EditContactInfoWithData from '../contactInfo/EditContactInfoWithData';
import { ContactInfoActivityRouter } from '../contactInfo/tabs/ContactInfoActivity';

const ContactContextualBar = () => {
	const router = useRouter();
	const contactId = useRouteParameter('id');
	const context = useRouteParameter('context');
	const contextId = useRouteParameter('contextId');

	const handleClose = () => router.navigate('/omnichannel-directory/contacts');
	const handleCancel = () => contactId && router.navigate(`/omnichannel-directory/contacts/${contactId}/details`);
	const handleActivityBack = () => contactId && router.navigate(`/omnichannel-directory/contacts/${contactId}/activity`);

	if (context === 'edit' && contactId) {
		return <EditContactInfoWithData id={contactId} onClose={handleClose} onCancel={handleCancel} />;
	}

	if (context === 'new' && !contactId) {
		return <EditContactInfo onClose={handleClose} onCancel={handleClose} />;
	}

	if (context === 'activity' && contextId !== undefined) {
		return <ContactInfoActivityRouter onClickBack={handleActivityBack} onClose={handleClose} />;
	}

	if (!contactId) {
		return <ContactInfoError onClose={handleClose} />;
	}

	return <ContactInfo id={contactId} onClose={handleClose} />;
};

export default ContactContextualBar;
