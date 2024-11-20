import React from 'react';

import DefaultAppsPageHeader from './DefaultAppsPageHeader';
import PrivateAppsPageHeader from './PrivateAppsPageHeader';
import { useMarketplaceContext } from '../hooks/useMarketplaceContext';

const AppsPageHeader = () => {
	const context = useMarketplaceContext();

	switch (context) {
		case 'private':
			return <PrivateAppsPageHeader />;

		default:
			return <DefaultAppsPageHeader />;
	}
};

export default AppsPageHeader;
