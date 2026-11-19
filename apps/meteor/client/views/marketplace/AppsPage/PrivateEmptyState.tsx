import { Stack } from '@rocket.chat/fuselage';

import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';

const PrivateEmptyState = () => {
	const privateAppsEnabled = usePrivateAppsEnabled();

	return (
		<Stack grow justify='center'>
			{privateAppsEnabled ? <PrivateEmptyStateDefault /> : <PrivateEmptyStateUpgrade />}
		</Stack>
	);
};

export default PrivateEmptyState;
