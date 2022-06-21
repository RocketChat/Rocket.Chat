import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, useState } from 'react';

import { VoipFooter } from './VoipFooter';

export default {
	title: 'Sidebar/Footer/VoipFooter',
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

const tooltips = {
	mute: 'Mute',
	holdCall: 'Hold Call',
	acceptCall: 'Accept Call',
	endCall: 'End Call',
};

export const IncomingCall = (): ReactElement => {
	const [muted, toggleMic] = useState(false);
	const [paused, togglePause] = useState(false);

	return (
		<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
			<VoipFooter
				caller={{
					callerName: 'Tiago',
					callerId: 'guest-1',
					host: '',
				}}
				callerState='OFFER_RECEIVED'
				callActions={callActions}
				title='Sales Department'
				subtitle='Calling'
				muted={muted}
				paused={paused}
				toggleMic={toggleMic}
				togglePause={togglePause}
				tooltips={tooltips}
				createRoom={() => ''}
				openRoom={() => ''}
				callsInQueue='2 Calls In Queue'
				dispatchEvent={() => null}
				openedRoomInfo={{ v: { token: '' }, rid: '' }}
				anonymousText={'Anonymous'}
			/>
		</Box>
	);
};

export const InCall = (): ReactElement => {
	const [muted, toggleMic] = useState(false);
	const [paused, togglePause] = useState(false);
	const getSubtitle = () => {
		if (paused) {
			return 'On Hold';
		}
		return 'In Progress';
	};

	return (
		<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
			<VoipFooter
				caller={{
					callerName: 'Tiago',
					callerId: 'guest-1',
					host: '',
				}}
				callerState='IN_CALL'
				callActions={callActions}
				title='Sales Department'
				subtitle={getSubtitle()}
				muted={muted}
				paused={paused}
				toggleMic={toggleMic}
				togglePause={togglePause}
				tooltips={tooltips}
				createRoom={() => ''}
				openRoom={() => ''}
				callsInQueue='2 Calls In Queue'
				dispatchEvent={() => null}
				openedRoomInfo={{ v: { token: '' }, rid: '' }}
				anonymousText={'Anonymous'}
			/>
		</Box>
	);
};
