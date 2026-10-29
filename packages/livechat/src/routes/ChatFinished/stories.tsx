import type { Meta, StoryFn } from '@storybook/preact';

import ChatFinished, { type ChatFinishedProps } from './index';
import { loremIpsum, screenDecorator, storeDecorator } from '../../../.storybook/helpers';
import store, { type StoreState } from '../../store';

type StoryArgs = ChatFinishedProps & Partial<StoreState>;

export default {
	title: 'Routes/ChatFinished',
	component: ChatFinished,
	decorators: [storeDecorator, screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<StoryArgs>;

const Template: StoryFn<StoryArgs> = (args) => <ChatFinished {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const WithCustomMessages = Template.bind({});
WithCustomMessages.storyName = 'with custom messages';
WithCustomMessages.args = {
	config: {
		...store.state.config,
		messages: {
			conversationFinishedMessage: loremIpsum({ count: 3, units: 'words' }),
			conversationFinishedText: loremIpsum({ count: 2, units: 'sentences' }),
		},
	},
};
