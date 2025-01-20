import type { VoIpCallerInfo } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { StoryFn } from '@storybook/react';
import { useState } from 'react';

import VoipFooter from './VoipFooter';

const callActions = {
	mute: () => ({}),
	unmute: () => ({}),
	pause: () => ({}),
	resume: () => ({}),
	end: () => ({}),
	pickUp: () => ({}),
	reject: () => ({}),
};

const callerDefault = {
	callerName: '',
	callerId: '+5551999999999',
	host: '',
};

export default {
	title: 'SidebarV2/Footer/VoipFooter',
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
		options: { control: false },
	},
};

const VoipFooterTemplate: StoryFn<typeof VoipFooter> = (args) => {
	const [muted, toggleMic] = useState(false);
	const [paused, togglePause] = useState(false);

	const getSubtitle = (state: VoIpCallerInfo['state']): string => {
		const subtitles: Record<string, string> = {
			IN_CALL: 'In Progress',
			OFFER_RECEIVED: 'Ringing',
			OFFER_SENT: 'Calling',
			ON_HOLD: 'On Hold',
		};

		return subtitles[state] || '';
	};

	return (
		<Box maxWidth='x300' bg='dark' borderRadius='x4'>
			<VoipFooter
				{...args}
				callActions={callActions}
				subtitle={getSubtitle(args.callerState)}
				muted={muted}
				paused={paused}
				toggleMic={toggleMic}
				togglePause={togglePause}
				createRoom={async () => ''}
				openRoom={() => ''}
				callsInQueue='2 Calls In Queue'
				dispatchEvent={() => null}
				openedRoomInfo={{ v: { token: '' }, rid: '' }}
				options={{
					deviceSettings: {
						label: (
							<Box alignItems='center' display='flex'>
								<Icon mie={4} name='customize' size='x16' />
								Device Settings
							</Box>
						),
					},
				}}
			/>
		</Box>
	);
};

export const IncomingCall = VoipFooterTemplate.bind({});
IncomingCall.args = {
	title: 'Sales Department',
	callerState: 'OFFER_RECEIVED',
	caller: callerDefault,
};

export const OutboundCall = VoipFooterTemplate.bind({});
OutboundCall.args = {
	title: 'Phone Call',
	callerState: 'OFFER_SENT',
	caller: {
		callerName: '',
		callerId: '+5551999999999',
		host: '',
	},
};

export const InCall = VoipFooterTemplate.bind({});
InCall.args = {
	title: 'Sales Department',
	callerState: 'IN_CALL',
	caller: callerDefault,
};

export const NoEnterpriseLicence = VoipFooterTemplate.bind({});
NoEnterpriseLicence.args = {
	title: 'Sales Department',
	callerState: 'IN_CALL',
	isEnterprise: false,
	caller: callerDefault,
};
