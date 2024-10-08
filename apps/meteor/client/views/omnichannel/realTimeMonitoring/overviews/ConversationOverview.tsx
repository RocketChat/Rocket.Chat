import type { OperationParams } from '@rocket.chat/rest-typings';
import type { MutableRefObject } from 'react';
import React from 'react';

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
};

const ConversationOverview = ({ params, reloadRef, ...props }: ConversationOverviewProps) => {
	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/conversation-totalizers', { params });

	reloadRef.current.conversationOverview = reload;

	return <CounterContainer state={state} counterData={data} initialData={initialData} flexGrow={1} flexShrink={1} width='50%' {...props} />;
};

export default ConversationOverview;
