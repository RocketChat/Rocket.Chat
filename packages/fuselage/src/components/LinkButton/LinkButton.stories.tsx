import type { Meta, StoryObj } from '@storybook/react';

import { Text } from '../Text';
import LinkButton from './LinkButton';

export default {
	title: 'Inputs/LinkButton',
	component: LinkButton,
	parameters: {
		docs: {
			description: {
				component:
					'A button that reads as a link inside a sentence. Use it for an inline action that stays on the page, such as resending an email or going back a step; an action that opens another page is a link (`a href`).\n\n' +
					'It takes the font of the text around it and no `Box` styling props.',
			},
		},
	},
	args: {
		children: 'Resend',
		onClick: () => undefined,
	},
} satisfies Meta<typeof LinkButton>;

type Story = StoryObj<typeof LinkButton>;

export const Default: Story = {};

export const InSentence: Story = {
	render: (args) => (
		<Text is='p' fontScale='c1'>
			Didn&apos;t receive email? <LinkButton {...args}>Resend</LinkButton> or <LinkButton {...args}>change email</LinkButton>
		</Text>
	),
};

export const Disabled: Story = {
	args: { disabled: true },
};
