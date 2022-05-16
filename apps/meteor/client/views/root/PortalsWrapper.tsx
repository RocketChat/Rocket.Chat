import React, { FC } from 'react';
import { useSubscription } from 'use-subscription';

import { portalsSubscription } from '../../lib/portals/portalsSubscription';
import PortalWrapper from './PortalWrapper';

const PortalsWrapper: FC = () => {
	const portals = useSubscription(portalsSubscription);

	return (
		<>
			{portals.map(({ key, portal }) => (
				<PortalWrapper key={key} portal={portal} />
			))}
		</>
	);
};

export default PortalsWrapper;
