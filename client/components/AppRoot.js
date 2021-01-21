import React from 'react';
import { useSubscription } from 'use-subscription';

import MeteorProvider from '../providers/MeteorProvider';
import { portalsSubscription } from '../reactAdapters';
import PortalWrapper from './PortalWrapper';

const AppRoot = () => {
	const portals = useSubscription(portalsSubscription);

	return <MeteorProvider>
		<div id='alert-anchor' />
		{portals.map(({ key, portal }) => <PortalWrapper key={key} portal={portal} />)}
	</MeteorProvider>;
};

export default AppRoot;
