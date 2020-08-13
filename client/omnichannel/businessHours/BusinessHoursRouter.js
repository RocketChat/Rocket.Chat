import React from 'react';

import { useRouteParameter } from '../../contexts/RouterContext';
import EditBusinessHoursPage from './EditBusinessHoursPage';
import BusinessHoursPage from './BusinessHoursPage';


const BusinessHoursRouter = () => {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const type = useRouteParameter('type');

	if (context === 'edit' && type) {
		return <EditBusinessHoursPage type={type} id={id}/>;
	}

	return <BusinessHoursPage />;
};

export default BusinessHoursRouter;
