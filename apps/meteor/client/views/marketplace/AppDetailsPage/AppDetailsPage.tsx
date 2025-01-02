import type { App } from '@rocket.chat/core-typings';

import InstalledAppDetailsPage from './InstalledAppDetailsPage';
import MarketplaceAppDetailsPage from './MarketplaceAppDetailsPage';
import SkeletonAppDetailsPage from './SkeletonAppDetailsPage';
import { useAppQuery } from '../hooks/useAppQuery';

type AppDetailsPageProps = {
	id: App['id'];
};

const AppDetailsPage = ({ id: appId }: AppDetailsPageProps) => {
	const { isPending, isError, error, data: app } = useAppQuery(appId);

	if (isPending) {
		return <SkeletonAppDetailsPage />;
	}

	if (isError) {
		throw error;
	}

	if (app.installed) {
		return <InstalledAppDetailsPage app={app} />;
	}

	return <MarketplaceAppDetailsPage app={app} />;
};

export default AppDetailsPage;
