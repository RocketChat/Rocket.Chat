import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { screenDecorator, screenProps } from '../../../.storybook/helpers';
import TriggerMessage from './component';

const now = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

const messages = [
	{ _id: 1, u: { _id: 1, username: 'guilherme.gazzo' }, msg: 'Hi There!' },
	{
		_id: 2,
		u: { _id: 2, username: 'guilherme.gazzo' },
		msg: 'Rocket.Chat allows you to chat and create better relationship with your customers on their favorite channels. ',
	},
	{ _id: 3, u: { _id: 3, username: 'guilherme.gazzo' }, msg: 'Let us know if you have any question.' },
].map((message, i) => ({
	...message,
	ts: new Date(now.getTime() - (15 - i) * 60000 - (i < 5 ? 24 * 60 * 60 * 1000 : 0)).toISOString(),
}));

export default {
	title: 'Routes/TriggerMessage',
	component: TriggerMessage,
	args: {
		messages,
		title: '',
		onSubmit: action('submit'),
		onCancel: action('cancel'),
		...screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof TriggerMessage>>;

const Template: Story<ComponentProps<typeof TriggerMessage>> = (args) => <TriggerMessage {...args} />;

export const Single = Template.bind({});
Single.storyName = 'single';
Single.args = {
	messages: messages.slice(-1),
};

export const Multiple = Template.bind({});
Multiple.storyName = 'multiple';
