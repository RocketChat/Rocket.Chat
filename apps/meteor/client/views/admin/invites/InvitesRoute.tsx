import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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
