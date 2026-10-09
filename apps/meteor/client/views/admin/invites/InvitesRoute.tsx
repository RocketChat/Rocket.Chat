import { usePermission } from '@rocket.chat/ui-contexts';

import InvitesPage from './InvitesPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const InvitesRoute = () => {
	const canManageInviteLinks = usePermission('manage-invite-links');

	if (!canManageInviteLinks) {
		return <NotAuthorizedPage />;
	}

	return <InvitesPage />;
};

export default InvitesRoute;
