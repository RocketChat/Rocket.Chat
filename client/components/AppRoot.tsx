import React, { FC } from 'react';
import { useSubscription } from 'use-subscription';

import { portalsSubscription } from '../lib/portals/portalsSubscription';
import MeteorProvider from '../providers/MeteorProvider';
import BannerRegion from '../views/banners/BannerRegion';
import BlazeLayoutWrapper from '../views/blazeLayout/BlazeLayoutWrapper';
import PortalWrapper from './PortalWrapper';

const AppRoot: FC = () => {
	const portals = useSubscription(portalsSubscription);

	return (
		<MeteorProvider>
			<BannerRegion />
			{portals.map(({ key, portal }) => (
				<PortalWrapper key={key} portal={portal} />
			))}
			<BlazeLayoutWrapper />
		</MeteorProvider>
	);
};

export default AppRoot;
