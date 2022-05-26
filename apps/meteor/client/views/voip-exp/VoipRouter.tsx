import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useEffect } from 'react';

import VoipLayout from './VoipLayout';

function VoipRouter(): ReactElement {
	const [routeName] = useCurrentRoute();
	const defaultRoute = useRoute('omnichannel-current-chats');
	useEffect(() => {
		if (routeName === 'omnichannel-index') {
			defaultRoute.push();
		}
	}, [defaultRoute, routeName]);

	return <VoipLayout></VoipLayout>;
}
export default VoipRouter;
