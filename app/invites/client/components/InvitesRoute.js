import React from 'react';

import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';
import InvitesPage from './InvitesPage';

function InvitesRoute() {
	const canCreateInviteLinks = usePermission('create-invite-links');

	if (!canCreateInviteLinks) {
		return <NotAuthorizedPage />;
	}

	return <InvitesPage />;
}

export default InvitesRoute;
