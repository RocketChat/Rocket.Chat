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
			})
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
	},
};

export const ExternalContact: Story = {
	args: {
		onClose: noop,
		actions: {
			voiceCall: noop,
			videoCall: noop,
			jumpToMessage: noop,
			directMessage: noop,
			userInfo: noop,
		},
		contact: externalContact,
	},
};

// export const WithCallHistory: Story = {
// 	args: {
// 		onClose: noop,
// 		actions: {
// 			voiceCall: noop,
// 			videoCall: noop,
// 			jumpToMessage: noop,
// 			directMessage: noop,
// 			userInfo: noop,
// 		},
// 	},
// };

// export const Empty: Story = {
// 	args: {
// 		onClose: noop,
// 		actions: {
// 			voiceCall: noop,
// 			videoCall: noop,
// 			jumpToMessage: noop,
// 			directMessage: noop,
// 			userInfo: noop,
// 		},
// 	},
// };
