import React from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const defaultValue = { title: '', value: '00:00:00' };

const initialData = [defaultValue, defaultValue, defaultValue, defaultValue];

const ProductivityOverview = ({ params, reloadRef, ...props }) => {
	const {
		value: data,
		phase: state,
		reload,
	} = useEndpointData('livechat/analytics/dashboards/productivity-totalizers', params);

	reloadRef.current.productivityOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props} />;
};

export default ProductivityOverview;
