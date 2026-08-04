import type { Meta, StoryFn } from '@storybook/preact';

import TriggerMessage, { type TriggerMessageProps } from './index';
import { screenDecorator, storeDecorator } from '../../../.storybook/helpers';
import type { StoreState } from '../../store';

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

type StoryArgs = TriggerMessageProps & Pick<StoreState, 'messages'>;

export default {
	title: 'Routes/TriggerMessage',
	component: TriggerMessage,
	decorators: [storeDecorator, screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<StoryArgs>;

const Template: StoryFn<StoryArgs> = (args) => <TriggerMessage {...args} />;

export const Single = Template.bind({});
Single.storyName = 'single';
Single.args = {
	messages: messages.slice(-1),
};

export const Multiple = Template.bind({});
Multiple.storyName = 'multiple';
Multiple.args = {
	messages,
};
