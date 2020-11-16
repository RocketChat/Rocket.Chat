import React from 'react';

import { useEndpointDataExperimental } from '../../../hooks/useEndpointDataExperimental';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: '-',
};

const initialData = [
	overviewInitalValue,
	overviewInitalValue,
	overviewInitalValue,
];

const AgentsOverview = ({ params, reloadRef, ...props }) => {
	const { data, state, reload } = useEndpointDataExperimental(
		'livechat/analytics/dashboards/agents-productivity-totalizers',
		params,
	);

	reloadRef.current.agentsOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props}/>;
};

export default AgentsOverview;
