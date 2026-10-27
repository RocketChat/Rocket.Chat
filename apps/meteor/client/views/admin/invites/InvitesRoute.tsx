import { usePermission } from '@rocket.chat/ui-contexts';

import InvitesPage from './InvitesPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const InvitesRoute = () => {
	const canCreateInviteLinks = usePermission('create-invite-links');

	if (!canCreateInviteLinks) {
		return <NotAuthorizedPage />;
	}

	return <InvitesPage />;
};

export default InvitesRoute;
