import React, { useEffect } from 'react';

import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import VoIPLayout from './VoIPLayout';

function VoIPRouter() {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('omnichannel-current-chats');
	useEffect(() => {
		if (routeName === 'omnichannel-index') {
			defaultRoute.push();
		}
	}, [defaultRoute, routeName]);
	return <VoIPLayout></VoIPLayout>;
}

export default VoIPRouter;
