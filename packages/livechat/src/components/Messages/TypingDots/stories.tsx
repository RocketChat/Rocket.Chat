import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { TypingDots } from '.';

export default {
	title: 'Messages/TypingDots',
	component: TypingDots,
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof TypingDots>;

const Template: ComponentStory<typeof TypingDots> = (args) => <TypingDots {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';
Default.args = {
	text: 'The attendant is typing',
};
