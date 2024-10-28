import React from 'react';

import { useMarketplaceContext } from '../hooks/useMarketplaceContext';
import DefaultAppsPageHeader from './DefaultAppsPageHeader';
import PrivateAppsPageHeader from './PrivateAppsPageHeader';

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
