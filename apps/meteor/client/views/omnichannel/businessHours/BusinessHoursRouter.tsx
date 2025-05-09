import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { useRouteParameter, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import BusinessHoursDisabledPage from './BusinessHoursDisabledPage';
import BusinessHoursMultiplePage from './BusinessHoursMultiplePage';
import EditBusinessHours from './EditBusinessHours';
import EditBusinessHoursWithData from './EditBusinessHoursWithData';
import { useIsSingleBusinessHours } from './useIsSingleBusinessHours';

const BusinessHoursRouter = () => {
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const type = useRouteParameter('type') as LivechatBusinessHourTypes;
	const businessHoursEnabled = useSetting('Livechat_enable_business_hours');
	const isSingleBH = useIsSingleBusinessHours();

	useEffect(() => {
		if (isSingleBH) {
			router.navigate('/omnichannel/businessHours/edit/default');
		}
	}, [isSingleBH, router, context, type]);

	if (!businessHoursEnabled) {
		return <BusinessHoursDisabledPage />;
	}

	if (context === 'edit' || isSingleBH) {
		return type ? <EditBusinessHoursWithData type={type} id={id} /> : null;
	}

	if (context === 'new') {
		return <EditBusinessHours type={LivechatBusinessHourTypes.CUSTOM} />;
	}

	return <BusinessHoursMultiplePage />;
};

export default BusinessHoursRouter;
