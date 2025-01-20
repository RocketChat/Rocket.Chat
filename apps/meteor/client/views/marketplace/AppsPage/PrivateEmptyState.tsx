import { Box } from '@rocket.chat/fuselage';

import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';

const PrivateEmptyState = () => {
	const privateAppsEnabled = usePrivateAppsEnabled();

	return <Box mbs='24px'>{privateAppsEnabled ? <PrivateEmptyStateDefault /> : <PrivateEmptyStateUpgrade />}</Box>;
};

export default PrivateEmptyState;
