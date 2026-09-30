import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import ContactTable from './ContactTable';

const ContactTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ContactTable />;
	}

	return <NotAuthorizedPage />;
};

export default ContactTab;
