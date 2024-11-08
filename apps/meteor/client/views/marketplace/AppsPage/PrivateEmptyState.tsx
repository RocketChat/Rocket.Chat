import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';
import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';

const PrivateEmptyState = () => {
	const privateAppsEnabled = usePrivateAppsEnabled();

	return <Box mbs='24px'>{privateAppsEnabled ? <PrivateEmptyStateDefault /> : <PrivateEmptyStateUpgrade />}</Box>;
};

export default PrivateEmptyState;
