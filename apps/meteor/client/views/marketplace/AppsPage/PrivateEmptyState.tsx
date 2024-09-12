import { Box, Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

import { useLicense } from '../../../hooks/useLicense';
import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';

const PrivateEmptyState = () => {
	const { data, isLoading } = useLicense({ loadValues: true });
	const { limits } = data || {};

	if (isLoading) {
		return <Skeleton />;
	}

	return <Box mbs='24px'>{limits?.privateApps?.max === 0 ? <PrivateEmptyStateUpgrade /> : <PrivateEmptyStateDefault />}</Box>;
};

export default PrivateEmptyState;
