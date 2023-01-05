import type { FC } from 'react';
import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { portalsSubscription } from '../../lib/portals/portalsSubscription';
import PortalWrapper from './PortalWrapper';

const PortalsWrapper: FC = () => {
	const portals = useSyncExternalStore(portalsSubscription.subscribe, portalsSubscription.getSnapshot);

	return (
		<>
			{portals.map(({ key, portal }) => (
				<PortalWrapper key={key} portal={portal} />
			))}
		</>
	);
};

export default PortalsWrapper;
