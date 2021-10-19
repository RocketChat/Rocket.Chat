import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

// import BreathingTime from './BreathingTime';
import Current from './Current';
import Header from './Header';
// import Incoming from './Incoming';

type OmnichannelCallComponentProps = {
	state: any;
	data: any;
	callData: any;
};

const OmnichannelCallComponent: FC<OmnichannelCallComponentProps> = ({ state, data, callData }) => {
	console.log('asd');
	return (
		<Box is='footer' pb='x12' pi='x16' height='x48' width='auto'>
			{data.callsInQueue && <Header calls={data.calls} />}
			{state === 'Current' && <Current room={callData} />}
			{/* {state === 'Incoming' && <Incoming />}
			{state === 'BreathingTime' && <BreathingTime />} */}
		</Box>
	);
};

export default OmnichannelCallComponent;
