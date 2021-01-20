import React, { useEffect } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import EditBusinessHoursPage from './EditBusinessHoursPage';
import NewBusinessHoursPage from './NewBusinessHoursPage';
import BusinessHoursPage from './BusinessHoursPage';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';

export const useIsSingleBusinessHours = () => useReactiveValue(useMutableCallback(() => businessHourManager.getTemplate())) === 'livechatBusinessHoursForm';

const BusinessHoursRouter = () => {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const type = useRouteParameter('type');
	const isSingleBH = useIsSingleBusinessHours();

	const router = useRoute('omnichannel-businessHours');

	useEffect(() => {
		if (isSingleBH && (context !== 'edit' || type !== 'default')) {
			router.push({
				context: 'edit',
				type: 'default',
			});
		}
	}, [context, isSingleBH, router, type]);

	if ((context === 'edit' && type) || (isSingleBH && (context !== 'edit' || type !== 'default'))) {
		return type ? <EditBusinessHoursPage type={type} id={id}/> : null;
	}

	if (context === 'new') {
		return <NewBusinessHoursPage/>;
	}

	return <BusinessHoursPage />;
};

export default BusinessHoursRouter;
