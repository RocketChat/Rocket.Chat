import { Box } from '@rocket.chat/fuselage';
import { ComponentStory } from '@storybook/react';
import React, { useState } from 'react';

import { VoipFooter } from './VoipFooter';

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
	holdCallEEOnly: 'Hold Call (Enterprise Edition only)',
	acceptCall: 'Accept Call',
	endCall: 'End Call',
};

export default {
	title: 'Sidebar/Footer/VoipFooter',
	component: VoipFooter,
	parameters: {
		controls: { expanded: true },
	},
	args: {
		isEnterprise: true,
	},
	argTypes: {
		caller: { control: false },
		callerState: { control: false },
		callActions: { control: false },
		title: { control: false },
		subtitle: { control: false },
		muted: { control: false },
		paused: { control: false },
		toggleMic: { control: false },
		togglePause: { control: false },
		tooltips: { control: false },
		createRoom: { control: false },
		openRoom: { control: false },
		callsInQueue: { control: false },
		dispatchEvent: { control: false },
		openedRoomInfo: { control: false },
		anonymousText: { control: false },
	},
};

const VoipFooterTemplate: ComponentStory<typeof VoipFooter> = (args) => {
	const [muted, toggleMic] = useState(false);
	const [paused, togglePause] = useState(false);

	const getSubtitle = () => {
		if (args.callerState === 'OFFER_RECEIVED') {
			return 'Calling';
		}

		return paused ? 'On Hold' : 'In Progress';
	};

	return (
		<Box maxWidth='x300' bg='neutral-800' borderRadius='x4'>
			<VoipFooter
				{...args}
				caller={{
					callerName: 'Tiago',
					callerId: 'guest-1',
					host: '',
				}}
				callActions={callActions}
				title='Sales Department'
				subtitle={getSubtitle()}
				muted={muted}
				paused={paused}
				toggleMic={toggleMic}
				togglePause={togglePause}
				tooltips={tooltips}
				createRoom={async () => ''}
				openRoom={() => ''}
				callsInQueue='2 Calls In Queue'
				dispatchEvent={() => null}
				openedRoomInfo={{ v: { token: '' }, rid: '' }}
				anonymousText={'Anonymous'}
			/>
		</Box>
	);
};

export const IncomingCall = VoipFooterTemplate.bind({});
IncomingCall.args = {
	callerState: 'OFFER_RECEIVED',
};

export const InCall = VoipFooterTemplate.bind({});
InCall.args = {
	callerState: 'IN_CALL',
};

export const NoEnterpriseLicence = VoipFooterTemplate.bind({});
NoEnterpriseLicence.args = {
	callerState: 'IN_CALL',
	isEnterprise: false,
};
