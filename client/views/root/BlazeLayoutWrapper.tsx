import React, { FC } from 'react';
import { useSubscription } from 'use-subscription';

import { subscription } from '../../lib/portals/blazeLayout';
import BlazeTemplate from './BlazeTemplate';

const BlazeLayoutWrapper: FC = () => {
	const descriptor = useSubscription(subscription);

	if (!descriptor) {
		return (
			<div className='page-loading'>
				<div className='loading-animation'>
					<div className='bounce bounce1'></div>
					<div className='bounce bounce2'></div>
					<div className='bounce bounce3'></div>
				</div>
			</div>
		);
	}

	return <BlazeTemplate template={descriptor.template} data={descriptor.regions ?? {}} />;
};

export default BlazeLayoutWrapper;
