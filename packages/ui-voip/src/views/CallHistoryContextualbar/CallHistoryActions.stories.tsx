import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import type { ReactElement } from 'react';

import type { HistoryActionCallbacks } from './CallHistoryActions';
import CallHistoryActions from './CallHistoryActions';
import { MockedMediaCallProvider } from '../../context';
import type { State } from '../../context/MediaCallContext';

const noop = () => undefined;

const meta = {
	title: 'V2/Views/CallHistoryContextualbar/CallHistoryActions',
	component: CallHistoryActions,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
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
} satisfies Meta<typeof CallHistoryActions>;

export default meta;

type Story = StoryObj<typeof meta>;

const actionList = ['voiceCall', 'videoCall', 'jumpToMessage', 'directMessage', 'userInfo'];

const getArgs = (index: number) => {
	return Object.fromEntries(actionList.slice(0, index).map((action) => [action, noop])) as HistoryActionCallbacks;
};

const getDecorator = (state: State) => {
	return (Story: StoryFn): ReactElement => (
		<MockedMediaCallProvider state={state}>
			<Story />
		</MockedMediaCallProvider>
	);
};

export const Default: Story = {
	args: {
		onClose: noop,
		actions: getArgs(5),
	},
	decorators: [getDecorator('closed')],
};

export const WithLessActions: Story = {
	args: {
		onClose: noop,
		actions: getArgs(3),
	},
	decorators: [getDecorator('closed')],
};

export const WithSingleAction: Story = {
	args: {
		onClose: noop,
		actions: getArgs(1),
	},
	decorators: [getDecorator('closed')],
};

export const WithDisabledVoiceCall: Story = {
	args: {
		onClose: noop,
		actions: getArgs(1),
	},
	decorators: [getDecorator('ongoing')],
};
