import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { usePrivateAppsDisabled } from '../hooks/usePrivateAppsDisabled';
import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';

const PrivateEmptyState = () => {
	const privateAppsDisabled = usePrivateAppsDisabled();

	return <Box mbs='24px'>{privateAppsDisabled ? <PrivateEmptyStateUpgrade /> : <PrivateEmptyStateDefault />}</Box>;
};

export default PrivateEmptyState;
