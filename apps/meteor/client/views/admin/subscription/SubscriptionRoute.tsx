import { usePermission } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import SubscriptionPage from './SubscriptionPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const SubscriptionRoute = () => {
	const canViewSubscription = usePermission('manage-cloud');

	if (!canViewSubscription) {
		return <NotAuthorizedPage />;
	}

	return <SubscriptionPage />;
};

export default memo(SubscriptionRoute);
