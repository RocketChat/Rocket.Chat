import { useContext } from 'react';

import { MarketplaceContext } from '../../../contexts/MarketplaceContext';

export const usePrivateAppsEnabled = () => {
	const { privateAppsEnabled } = useContext(MarketplaceContext);

	return privateAppsEnabled;
};
