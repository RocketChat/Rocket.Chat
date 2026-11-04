import { useRouteParameter } from '@rocket.chat/ui-contexts';

import { AppHome } from './AppHome';

const AppHomePage = () => {
	const appId = useRouteParameter('appId');

	return appId ? <AppHome key={appId} appId={appId} /> : null;
};

export default AppHomePage;
