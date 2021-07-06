import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect } from 'react';

import { businessHourManager } from '../../../../app/livechat/client/views/app/business-hours/BusinessHours';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import BusinessHoursPage from './BusinessHoursPage';
import EditBusinessHoursPage from './EditBusinessHoursPage';
import NewBusinessHoursPage from './NewBusinessHoursPage';

export const useIsSingleBusinessHours = () =>
	useReactiveValue(useMutableCallback(() => businessHourManager.getTemplate())) ===
	'livechatBusinessHoursForm';

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
		return type ? <EditBusinessHoursPage type={type} id={id} /> : null;
	}

	if (context === 'new') {
		return <NewBusinessHoursPage />;
	}

	return <BusinessHoursPage />;
};

export default BusinessHoursRouter;
