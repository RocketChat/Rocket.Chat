import type { OperationParams } from '@rocket.chat/rest-typings';
import type { MutableRefObject } from 'react';
import React from 'react';

import { useEndpointData } from '../../../../hooks/useEndpointData';
import CounterContainer from '../counter/CounterContainer';

const initialData = [
	{ title: '', value: 0 },
	{ title: '', value: '0%' },
	{ title: '', value: '00:00:00' },
];

type ChatsOverviewProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/chats-totalizers'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
};

const ChatsOverview = ({ params, reloadRef, ...props }: ChatsOverviewProps) => {
	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/chats-totalizers', { params });

	reloadRef.current.chatsOverview = reload;

	return <CounterContainer state={state} data={data} initialData={initialData} {...props} />;
};

export default ChatsOverview;
