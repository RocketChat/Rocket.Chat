import React from 'react';

import { useEndpointDataExperimental } from '../../../hooks/useEndpointDataExperimental';
import CounterContainer from '../counter/CounterContainer';

const overviewInitalValue = {
	title: '',
	value: 0,
};

const initialData = [
	overviewInitalValue,
	overviewInitalValue,
	overviewInitalValue,
	overviewInitalValue,
];

const ConversationOverview = ({ params, reloadRef, ...props }) => {
	const { data, state, reload } = useEndpointDataExperimental(
		'livechat/analytics/dashboards/conversation-totalizers',
		params,
	);

	reloadRef.current.conversationOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props}/>;
};

export default ConversationOverview;
