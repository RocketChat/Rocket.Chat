import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BusinessHoursPage from './BusinessHoursPage';
import EditBusinessHoursPage from './EditBusinessHoursPage';
import NewBusinessHoursPage from './NewBusinessHoursPage';

export const useIsSingleBusinessHours = () =>
	useReactiveValue(useMutableCallback(() => businessHourManager.getTemplate())) === 'livechatBusinessHoursForm';

const BusinessHoursRouter = () => {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const type = useRouteParameter('type');
	const isSingleBH = useIsSingleBusinessHours();

	const router = useRoute('omnichannel-businessHours');

	useEffect(() => {
		if (isSingleBH) {
			router.push({
				context: 'edit',
				type: 'default',
			});
		}
	}, [isSingleBH, router]);

	if (context === 'edit' || isSingleBH) {
		return type ? <EditBusinessHoursPage type={type} id={id} /> : null;
	}

	if (context === 'new') {
		return <NewBusinessHoursPage />;
	}

	return <BusinessHoursPage />;
};

export default BusinessHoursRouter;
