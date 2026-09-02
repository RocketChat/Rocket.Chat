import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import CallHistoryContextualbar from './CallHistoryContextualbar';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const noop = () => undefined;

const meta = {
	component: CallHistoryContextualbar,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Call_info: 'Call info',
				Direct_message: 'Direct message',
				Call: 'Call',
				Call_ended_bold: '*Voice call ended*',
				Voice_call_not_placed: 'Voice call not placed',
				Prevented_by_app: 'Prevented by app: {{appName}}',
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
			// The app's own namespace, so the i18n-key reason renders in the reader's language (spec §6).
			.withTranslations('en', 'app-call-policy', {
				call_prevented_for_callee: 'Calls to {{callee}} are not allowed by this workspace',
			})
			.withDefaultLanguage('en-US')
			.buildStoryDecorator(),
		(Story) => (
			<MockedMediaCallProvider>
				<Story />
			</MockedMediaCallProvider>
		),
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

const preventedCallData = {
	callId: '1234567890',
	direction: 'outbound',
	duration: 0,
	startedAt: new Date('2025-02-07T12:00:00.000Z'),
	state: 'prevented',
} as const;

// An app that wrote its own words. The card carries them, and "Prevented by {app name}" sits below.
export const PreventedWithReason: Story = {
	args: {
		onClose: noop,
		actions: { voiceCall: noop, directMessage: noop },
		contact: internalContact,
		data: {
			...preventedCallData,
			preventedBy: { appId: 'call-policy', appName: 'Call Policy', text: 'The callee is on a Do Not Disturb list' },
		},
	},
};

// An app that named a translation key. The reason renders in the app namespace (spec §6).
export const PreventedWithTranslatedReason: Story = {
	args: {
		onClose: noop,
		actions: { voiceCall: noop, directMessage: noop },
		contact: internalContact,
		data: {
			...preventedCallData,
			preventedBy: {
				appId: 'call-policy',
				appName: 'Call Policy',
				text: 'Calls to user2 are not allowed by this workspace',
				key: 'call_prevented_for_callee',
				ns: 'app-call-policy',
				args: { callee: 'user2' },
			},
		},
	},
};

// A malformed record that named neither a reason nor a key. The card's own second line reads
// "Prevented by {app name}", so it is not repeated below (spec §4, §7).
export const PreventedWithoutReason: Story = {
	args: {
		onClose: noop,
		actions: { voiceCall: noop, directMessage: noop },
		contact: internalContact,
		data: {
			...preventedCallData,
			preventedBy: { appId: 'call-policy', appName: 'Call Policy', text: '' },
		},
	},
};
