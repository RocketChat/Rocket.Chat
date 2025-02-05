import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: 0,
};

const initialData = [overviewInitalValue, overviewInitalValue, overviewInitalValue, overviewInitalValue];

type ConversationOverviewProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/conversation-totalizers'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ConversationOverview = ({ params, reloadRef, ...props }: ConversationOverviewProps) => {
	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/conversation-totalizers', { params });

	reloadRef.current.conversationOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props} />;
};

export default ConversationOverview;
