import { useContext } from 'react';

import type { MarketplaceContextValue } from '../MarketplaceContext';
import { MarketplaceContext } from '../MarketplaceContext';

export const useAppsResult = (): MarketplaceContextValue => useContext(MarketplaceContext);
