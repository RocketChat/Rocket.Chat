import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import CallControls from './CallControls';
import CallerInfo from './CallerInfo';
import Header from './Header';

type CallComponentProps = {
	state?: any;
	data?: any;
	callData?: any;
	test?: any;
	buttons?: any;
};

const CallComponent: FC<CallComponentProps> = ({ data, callData, buttons }) => (
	<Box is='footer' p='x16' width='auto'>
		{data.callsInQueue && (
			<Header state={data.state} buttonList={buttons} calls={data.callsInQueue} />
		)}

		{data.state === 'Incoming' && (
			<Box display='flex'>
				<CallerInfo callerData={callData} />
				<CallControls state={data.state} />
			</Box>
		)}
	</Box>
);

export default CallComponent;
