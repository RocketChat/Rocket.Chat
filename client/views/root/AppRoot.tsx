import React, { FC } from 'react';

import MeteorProvider from '../../providers/MeteorProvider';
import BannerRegion from '../banners/BannerRegion';
import BlazeLayoutWrapper from './BlazeLayoutWrapper';
import PortalsWrapper from './PortalsWrapper';

const AppRoot: FC = () => (
	<MeteorProvider>
		<BannerRegion />
		<PortalsWrapper />
		<BlazeLayoutWrapper />
	</MeteorProvider>
);

export default AppRoot;
