import PrivateEmptyStateDefault from './PrivateEmptyStateDefault';
import PrivateEmptyStateUpgrade from './PrivateEmptyStateUpgrade';
import AppsPageEmptyState from './layout/AppsPageEmptyState';
import { usePrivateAppsEnabled } from '../hooks/usePrivateAppsEnabled';

const PrivateEmptyState = () => {
	const privateAppsEnabled = usePrivateAppsEnabled();

	return (
		<AppsPageEmptyState offset='x24'>{privateAppsEnabled ? <PrivateEmptyStateDefault /> : <PrivateEmptyStateUpgrade />}</AppsPageEmptyState>
	);
};

export default PrivateEmptyState;
