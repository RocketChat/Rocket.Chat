import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';

import CallHistoryContextualbar from './CallHistoryContextualbar';

const noop = () => undefined;

const meta = {
	title: 'V2/Views/CallHistoryContextualbar',
	component: CallHistoryContextualbar,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Call_info: 'Call info',
				Direct_message: 'Direct message',
				Call: 'Call',
				Call_ended_bold: '*Voice call ended*',
				Incoming_voice_call: 'Incoming voice call',
				Outgoing_voice_call: 'Outgoing voice call',
				Duration: 'Duration',
				Voice_call_extension: 'Voice call extension',
				Call_ID: 'Call ID',
				Options: 'Options',
				Voice_call: 'Voice call',
				Video_call: 'Video call',
				Jump_to_message: 'Jump to message',
				Direct_Message: 'Direct Message',
				User_info: 'User info',
			})
			.withDefaultLanguage('en-US')
			.buildStoryDecorator(),
		(Story): ReactElement => <Story />,
	],
} satisfies Meta<typeof CallHistoryContextualbar>;

export default meta;

type Story = StoryObj<typeof meta>;

const externalContact = {
	number: '1234567890',
};

const internalContact = {
	_id: '1234567890',
	name: 'John Doe',
	username: 'john.doe',
	voiceCallExtension: '0000',
};

export const Default: Story = {
	args: {
		onClose: noop,
		actions: {
			voiceCall: noop,
			videoCall: noop,
			jumpToMessage: noop,
			directMessage: noop,
			userInfo: noop,
		},
		contact: internalContact,
		data: {
			callId: '1234567890',
			direction: 'inbound',
			duration: 100,
			startedAt: new Date('2025-02-07T12:00:00.000Z'),
			state: 'ended',
		},
	},
};

export const ExternalContact: Story = {
	args: {
		onClose: noop,
		actions: {
			voiceCall: noop,
		},
		data: {
			callId: '1234567890',
			direction: 'inbound',
			duration: 100,
			startedAt: new Date('2025-02-07T12:00:00.000Z'),
			state: 'ended',
		},
		contact: externalContact,
	},
};
