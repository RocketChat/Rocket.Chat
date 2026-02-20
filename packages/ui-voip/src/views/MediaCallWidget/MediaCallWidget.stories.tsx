import { Button } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import MediaCallWidget from './MediaCallWidget';
import { useMediaCallContext, MockedMediaCallProvider } from '../../context';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		New_Call: 'New Call',
		Incoming_call: 'Incoming Call',
		Enter_username_or_number: 'Enter username or number',
		Call: 'Call',
		Calling: 'Calling',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

const meta = {
	title: 'V2/MediaCallWidget',
	component: MediaCallWidget,
	args: {
		state: 'closed',
	},
	decorators: [
		mockedContexts,
		(Story, options) => (
			<MockedMediaCallProvider {...options.args}>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof MediaCallWidget>;
export default meta;

type Story = StoryObj<typeof meta>;

export const MediaCallWidgetManualTesting: StoryFn<typeof MediaCallWidget> = () => {
	const { onToggleWidget, onCall, state } = useMediaCallContext();
	return (
		<>
			<Button onClick={() => onToggleWidget()} disabled={state !== 'new' && state !== 'closed'} mie={8}>
				Toggle widget
			</Button>
			<Button onClick={() => onCall()} disabled={state !== 'closed'}>
				Receive call
			</Button>
			<MediaCallWidget />
		</>
	);
};

export const NewCall: Story = {
	args: {
		state: 'new',
	},
};

export const IncomingCall: Story = {
	args: {
		state: 'ringing',
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
