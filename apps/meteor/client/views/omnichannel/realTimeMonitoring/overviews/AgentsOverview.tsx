import type { OperationParams } from '@rocket.chat/rest-typings';
import type { MutableRefObject } from 'react';
import React from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: '-',
};

type AgentsOverviewChartsProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/agents-productivity-totalizers'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
};

const initialData = [overviewInitalValue, overviewInitalValue, overviewInitalValue];

const AgentsOverview = ({ params, reloadRef, ...props }: AgentsOverviewChartsProps) => {
	const {
		value: data,
		phase: state,
		reload,
	} = useEndpointData('/v1/livechat/analytics/dashboards/agents-productivity-totalizers', { params });

	reloadRef.current.agentsOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props} />;
};

export default AgentsOverview;
