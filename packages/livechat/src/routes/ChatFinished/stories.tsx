import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { screenProps, loremIpsum, screenDecorator } from '../../helpers.stories';
import ChatFinished from './component';

export default {
	title: 'Routes/ChatFinished',
	component: ChatFinished,
	args: {
		title: 'Chat Finished',
		greeting: '',
		message: '',
		onRedirectChat: action('redirectChat'),
		...screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof ChatFinished>;

const Template: ComponentStory<typeof ChatFinished> = (args) => <ChatFinished {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const WithCustomMessages = Template.bind({});
WithCustomMessages.storyName = 'with custom messages';
WithCustomMessages.args = {
	greeting: loremIpsum({ count: 3, units: 'words' }),
	message: loremIpsum({ count: 2, units: 'sentences' }),
};
