import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { TypingDots } from '.';

export default {
	title: 'Messages/TypingDots',
	component: TypingDots,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof TypingDots>>;

const Template: Story<ComponentProps<typeof TypingDots>> = (args) => <TypingDots {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';
Default.args = {
	text: 'The attendant is typing',
};
