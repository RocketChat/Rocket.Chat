import React, { FC } from 'react';

import ConnectionStatusBar from '../../components/connectionStatus/ConnectionStatusBar';
import MeteorProvider from '../../providers/MeteorProvider';
import BannerRegion from '../banners/BannerRegion';
import BlazeLayoutWrapper from './BlazeLayoutWrapper';
import PortalsWrapper from './PortalsWrapper';

const AppRoot: FC = () => (
	<MeteorProvider>
		<ConnectionStatusBar />
		<BannerRegion />
		<PortalsWrapper />
		<BlazeLayoutWrapper />
	</MeteorProvider>
);

export default AppRoot;
