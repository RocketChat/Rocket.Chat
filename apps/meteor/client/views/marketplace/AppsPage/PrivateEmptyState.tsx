import { Box, Skeleton } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useLicense } from '../../../hooks/useLicense';
import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';

const PrivateEmptyState = () => {
	const { data, isLoading } = useLicense({ loadValues: true });
	const { limits } = data || {};
	const isAdmin = usePermission('manage-apps');

	if (isLoading) {
		return <Skeleton />;
	}

	return <Box mbs='24px'>{isAdmin && limits?.privateApps?.max === 0 ? <PrivateEmptyStateUpgrade /> : <PrivateEmptyStateDefault />}</Box>;
};

export default PrivateEmptyState;
