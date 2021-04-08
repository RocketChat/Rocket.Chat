import React, { FC } from 'react';
import { useSubscription } from 'use-subscription';

import { subscription } from '../../lib/portals/blazeLayout';
import BlazeTemplate from './BlazeTemplate';

const BlazeLayoutWrapper: FC = () => {
	const descriptor = useSubscription(subscription);

	if (!descriptor) {
		return null;
	}

	return <BlazeTemplate template={descriptor.template} data={descriptor.regions ?? {}} />;
};

export default BlazeLayoutWrapper;
