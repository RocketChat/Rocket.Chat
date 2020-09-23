import React from 'react';
import { Box } from '@rocket.chat/fuselage';

const Base = (props) => <Box size='x12' borderRadius='full' flexShrink={0} {...props}/>;

export const Busy = (props) => <Base bg='danger-500' {...props}/>;
export const Away = (props) => <Base bg='warning-600' {...props}/>;
export const Online = (props) => <Base bg='success-500' {...props}/>;
export const Offline = (props) => <Base bg='neutral-600' {...props}/>;


export const getStatus = (status, props) => {
	switch (status) {
		case 'online':
			return <Online {...props}/>;
		case 'busy':
			return <Busy {...props}/>;
		case 'away':
			return <Away {...props}/>;
		default:
			return <Offline {...props}/>;
	}
};
