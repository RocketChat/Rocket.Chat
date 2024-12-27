import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: '-',
};

type AgentsOverviewChartsProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/agents-productivity-totalizers'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

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
