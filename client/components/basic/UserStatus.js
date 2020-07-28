import React from 'react';
import { Box } from '@rocket.chat/fuselage';

const Base = (props) => <Box size='x12' borderRadius='full' flexShrink={0} {...props}/>;

export const Busy = () => <Base bg='danger-500'/>;
export const Away = () => <Base bg='warning-600'/>;
export const Online = () => <Base bg='success-500'/>;
export const Offline = () => <Base bg='neutral-600'/>;


export const getStatus = (status) => {
	switch (status) {
		case 'online':
			return <Online/>;
		case 'busy':
			return <Busy/>;
		case 'away':
			return <Away/>;
		default:
			return <Offline/>;
	}
};
