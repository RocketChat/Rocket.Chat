import React, { useEffect } from 'react';

import EditBusinessHoursPage from './EditBusinessHoursPage';
import NewBusinessHoursPage from './NewBusinessHoursPage';
import BusinessHoursPage from './BusinessHoursPage';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { businessHourManager } from '../../../app/livechat/client/views/app/business-hours/BusinessHours';

const getTemplate = () => businessHourManager.getTemplate();

const BusinessHoursRouter = () => {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const type = useRouteParameter('type');
	const view = useReactiveValue(getTemplate);

	const router = useRoute('omnichannel-businessHours');

	useEffect(() => {
		if (view === 'livechatBusinessHoursForm' && context !== 'edit' && type !== 'default') {
			router.push({
				context: 'edit',
				type: 'default',
			});
		}
	}, [context, router, type, view]);

	if ((context === 'edit' && type) || (view === 'livechatBusinessHoursForm' && context !== 'edit' && type !== 'default')) {
		return <EditBusinessHoursPage type={type} id={id}/>;
	}

	if (context === 'new') {
		return <NewBusinessHoursPage/>;
	}

	return <BusinessHoursPage />;
};

export default BusinessHoursRouter;
