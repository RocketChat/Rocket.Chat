import { usePermission } from '@rocket.chat/ui-contexts';

import ContactTable from './ContactTable';
import NotAuthorizedPage from '../../../notAuthorized/NotAuthorizedPage';

const ContactTab = () => {
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ContactTable />;
	}

	return <NotAuthorizedPage />;
};

export default ContactTab;
