import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import BusinessHoursMultiplePage from './BusinessHoursMultiplePage';
import EditBusinessHours from './EditBusinessHours';
import EditBusinessHoursWithData from './EditBusinessHoursWithData';
import { useIsSingleBusinessHours } from './useIsSingleBusinessHours';

const BusinessHoursRouter = () => {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const type = useRouteParameter('type') as LivechatBusinessHourTypes;
	const isSingleBH = useIsSingleBusinessHours();

	const router = useRouter();

	useEffect(() => {
		if (isSingleBH) {
			router.navigate('/omnichannel/businessHours/edit/default');
		}
	}, [isSingleBH, router, context, type]);

	if (context === 'edit' || isSingleBH) {
		return type ? <EditBusinessHoursWithData type={type} id={id} /> : null;
	}

	if (context === 'new') {
		return <EditBusinessHours type={LivechatBusinessHourTypes.CUSTOM} />;
	}

	return <BusinessHoursMultiplePage />;
};

export default BusinessHoursRouter;
