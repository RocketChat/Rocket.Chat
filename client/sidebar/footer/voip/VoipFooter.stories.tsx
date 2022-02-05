import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, useState } from 'react';

import { VoipFooter } from './VoipFooter';

export default {
	title: 'sidebar/footer/voip',
	component: VoipFooter,
};

const callActions = {
	mute: () => ({}),
	unmute: () => ({}),
	pause: () => ({}),
	resume: () => ({}),
	end: () => ({}),
	pickUp: () => ({}),
	reject: () => ({}),
};

export const Default = (): ReactElement => {
	const [muted, toggleMic] = useState(false);
	const [paused, togglePause] = useState(false);

	return (
		<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
			<VoipFooter
				callerName='Tiago'
				callerState='OFFER_RECEIVED'
				callActions={callActions}
				title='Sales Department'
				subtitle='Calling'
				muted={muted}
				paused={paused}
				toggleMic={toggleMic}
				togglePause={togglePause}
			/>
		</Box>
	);
};
