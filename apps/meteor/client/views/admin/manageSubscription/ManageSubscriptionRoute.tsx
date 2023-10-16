import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ManageSubscriptionPage from './ManageSubscriptionPage';

const ManageSubscriptionRoute = (): ReactElement => {
	const canViewManageSubscription = usePermission('manage-cloud');

	if (!canViewManageSubscription) {
		return <NotAuthorizedPage />;
	}

	return <ManageSubscriptionPage />;
};

export default memo(ManageSubscriptionRoute);
