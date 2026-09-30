import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import SubscriptionPage from './SubscriptionPage';

const SubscriptionRoute = () => {
	const canViewSubscription = usePermission('manage-cloud');

	if (!canViewSubscription) {
		return <NotAuthorizedPage />;
	}

	return <SubscriptionPage />;
};

export default memo(SubscriptionRoute);
