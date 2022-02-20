import React from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const initialData = [
	{ title: '', value: 0 },
	{ title: '', value: '0%' },
	{ title: '', value: '00:00:00' },
];

const ChatsOverview = ({ params, reloadRef, ...props }) => {
	const { value: data, phase: state, reload } = useEndpointData('livechat/analytics/dashboards/chats-totalizers', params);

	reloadRef.current.chatsOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props} />;
};

export default ChatsOverview;
