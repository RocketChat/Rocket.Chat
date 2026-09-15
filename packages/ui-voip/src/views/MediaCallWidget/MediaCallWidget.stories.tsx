import { Button } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import MediaCallWidget from './MediaCallWidget';
import { useMediaCallInstance, useMediaCallView, useWidgetExternalControls } from '../../context';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		New_Call: 'New call',
		Incoming_call: 'Incoming call',
		Enter_username_or_number: 'Enter username or number',
		meteor_status_connecting: 'Connecting...',
		Call: 'Call',
		Calling: 'Calling',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

const meta = {
	title: 'Views/MediaCallWidget/Draggable Widget',
	component: MediaCallWidget,
	args: {
		state: 'none',
	},
	decorators: [
		mockedContexts,
		(Story, options) => (
			<MockedMediaCallProvider instanceProps={{ targetWidgetVisibility: 'open' }} {...options.args}>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof MediaCallWidget>;
export default meta;

type Story = StoryObj<typeof meta>;

export const MediaCallWidgetManualTesting: Story = {
	args: {
		instanceProps: {},
	},
	render: () => {
		const { targetWidgetVisibility } = useMediaCallInstance();
		const { sessionState, onCall } = useMediaCallView();
		const { toggleWidget } = useWidgetExternalControls();
		const { state } = sessionState;
		return (
			<>
				<Button onClick={() => toggleWidget()} disabled={state !== 'none'} marginInlineEnd={8}>
					Toggle widget
				</Button>
				<Button onClick={() => onCall()} disabled={targetWidgetVisibility !== 'closed'}>
					Receive call
				</Button>
				<MediaCallWidget />
			</>
		);
	},
};

export const NewCall: Story = {
	args: {
		state: 'none',
	},
};

export const IncomingCall: Story = {
	args: {
		state: 'ringing',
	},
};

export const IncomingCallConnecting: Story = {
	args: {
		state: 'ringing',
		connectionState: 'CONNECTING',
	},
};

export const IncomingCallTransfer: Story = {
	args: {
		state: 'ringing',
		transferredBy: 'Jason',
	},
};

export const OutgoingCall: Story = {
	args: {
		state: 'calling',
	},
};

export const OutgoingCallConnecting: Story = {
	args: {
		state: 'calling',
		connectionState: 'CONNECTING',
	},
};

export const OutgoingCallTransfer: Story = {
	args: {
		state: 'calling',
		transferredBy: 'Joy',
	},
};

export const OngoingCall: Story = {
	args: {
		state: 'ongoing',
	},
};

export const OngoingCallConnecting: Story = {
	args: {
		state: 'ongoing',
		connectionState: 'CONNECTING',
	},
};

export const OngoingCallDisabledAllFeatures: Story = {
	args: {
		state: 'ongoing',
		supportedFeatures: [],
	},
};

export const OngoingCallDisabledAllButScreenshare: Story = {
	args: {
		state: 'ongoing',
		supportedFeatures: ['screen-share'],
	},
};

export const OngoingCallNoScreenSharingPermission: Story = {
	args: {
		state: 'ongoing',
		supportedFeatures: ['screen-share', 'audio', 'hold', 'transfer'],
		allowedFeatures: ['audio', 'hold', 'transfer'],
	},
};
