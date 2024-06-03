import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import SubscriptionPage from './SubscriptionPage';

const SubscriptionRoute = (): ReactElement => {
	const canViewSubscription = usePermission('manage-cloud');

	if (!canViewSubscription) {
		return <NotAuthorizedPage />;
	}

	return <SubscriptionPage />;
};

export default memo(SubscriptionRoute);
