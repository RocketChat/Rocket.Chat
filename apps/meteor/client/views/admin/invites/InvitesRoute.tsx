import React, { ReactElement } from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import InvitesPage from './InvitesPage';

const InvitesRoute = (): ReactElement => {
	const canCreateInviteLinks = usePermission('create-invite-links');

	if (!canCreateInviteLinks) {
		return <NotAuthorizedPage />;
	}

	return <InvitesPage />;
};

export default InvitesRoute;
