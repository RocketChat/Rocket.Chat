import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import InvitesPage from './InvitesPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const InvitesRoute = (): ReactElement => {
	const canCreateInviteLinks = usePermission('create-invite-links');

	if (!canCreateInviteLinks) {
		return <NotAuthorizedPage />;
	}

	return <InvitesPage />;
};

export default InvitesRoute;
