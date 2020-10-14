import React from 'react';

import { useEndpointDataExperimental } from '../../../hooks/useEndpointDataExperimental';
import CounterContainer from '../counter/CounterContainer';

const defaultValue = { title: '', value: '00:00:00' };


const initialData = [
	defaultValue,
	defaultValue,
	defaultValue,
	defaultValue,
];

const ProductivityOverview = ({ params, reloadRef, ...props }) => {
	const { data, state, reload } = useEndpointDataExperimental(
		'livechat/analytics/dashboards/productivity-totalizers',
		params,
	);

	reloadRef.current.productivityOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props}/>;
};

export default ProductivityOverview;
