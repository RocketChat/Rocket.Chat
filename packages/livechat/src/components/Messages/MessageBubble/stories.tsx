import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { MessageBubble } from '.';
import { loremIpsum } from '../../../helpers.stories';

const text = loremIpsum({ count: 1, units: 'sentences' });

export default {
	title: 'Messages/MessageBubble',
	component: MessageBubble,
	args: {
		children: text,
		inverse: false,
		nude: false,
		quoted: false,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof MessageBubble>;

const Template: ComponentStory<typeof MessageBubble> = (args) => <MessageBubble {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const Inverse = Template.bind({});
Inverse.storyName = 'inverse';
Inverse.args = {
	inverse: true,
};

export const Nude = Template.bind({});
Nude.storyName = 'nude';
Nude.args = {
	nude: true,
};

export const Quoted = Template.bind({});
Quoted.storyName = 'quoted';
Quoted.args = {
	quoted: true,
};
