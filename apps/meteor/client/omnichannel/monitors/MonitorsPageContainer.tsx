import MonitorsPage from './MonitorsPage';
import PageSkeleton from '../../components/PageSkeleton';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../views/notAuthorized/NotAuthorizedPage';

const MonitorsPageContainer = () => {
	const license = useHasLicenseModule('livechat-enterprise');

	if (license === 'loading') {
		return <PageSkeleton />;
	}

	if (!license) {
		return <NotAuthorizedPage />;
	}

	return <MonitorsPage />;
};

export default MonitorsPageContainer;
