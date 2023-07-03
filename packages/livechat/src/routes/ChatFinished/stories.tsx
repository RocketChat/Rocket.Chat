import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

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
} satisfies Meta<ComponentProps<typeof ChatFinished>>;

const Template: Story<ComponentProps<typeof ChatFinished>> = (args) => <ChatFinished {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const WithCustomMessages = Template.bind({});
WithCustomMessages.storyName = 'with custom messages';
WithCustomMessages.args = {
	greeting: loremIpsum({ count: 3, units: 'words' }),
	message: loremIpsum({ count: 2, units: 'sentences' }),
};
