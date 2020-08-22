import React from 'react';

import { useEndpointDataExperimental } from '../../../hooks/useEndpointDataExperimental';
import CounterContainer from '../counter/CounterContainer';

const initialData = [
	{ title: '', value: 0 },
	{ title: '', value: '0%' },
	{ title: '', value: '00:00:00' },
];

const ChatsOverview = ({ params, reloadRef, ...props }) => {
	const { data, state, reload } = useEndpointDataExperimental(
		'livechat/analytics/dashboards/chats-totalizers',
		params,
	);

	reloadRef.current.chatsOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props}/>;
};

export default ChatsOverview;
