import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';

import { Box } from '../../Box';
import { BasicMessageTemplate } from '../helpers';
import MessageToolbar from './MessageToolbar';
import MessageToolbarItem from './MessageToolbarItem';
import MessageToolbarWrapper from './MessageToolbarWrapper';

export default {
	title: 'Message/MessageToolbar',
	component: MessageToolbar,
	subcomponents: {
		MessageToolbarItem,
	},
	argTypes: {
		children: {
			control: false,
			description: 'Toolbar buttons, composed from MessageToolbarItem.',
			table: { category: 'Content' },
		},
		align: {
			control: 'select',
			options: ['start', 'center', 'end'],
			description: 'Horizontal alignment of the toolbar items.',
			table: { category: 'Layout', defaultValue: { summary: 'start' } },
		},
		stretch: {
			control: 'boolean',
			description: 'Stretches items to fill the available width.',
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			description: 'Allows items to wrap onto multiple lines.',
			table: { category: 'Layout' },
		},
		vertical: {
			control: 'boolean',
			description: 'Stacks items vertically instead of horizontally.',
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			description: 'Small size scale for the toolbar items.',
			table: { category: 'Size', defaultValue: { summary: 'true' } },
		},
		large: {
			control: 'boolean',
			description: 'Large size scale for the toolbar items.',
			table: { category: 'Size' },
		},
	},
} satisfies Meta<typeof MessageToolbar>;

type Story = StoryObj<typeof MessageToolbar>;

const MessageWithToolbar = ({ visible }: { visible: boolean }) => (
	<BasicMessageTemplate
		toolbar={
			<MessageToolbarWrapper visible={visible}>
				<MessageToolbar>
					<MessageToolbarItem title='Quote' icon='quote' />
					<MessageToolbarItem title='Emoji' icon='emoji' />
					<MessageToolbarItem title='Thread' icon='thread' />
					<MessageToolbarItem title='Menu' icon='menu' />
				</MessageToolbar>
			</MessageToolbarWrapper>
		}
	/>
);

// The story plays the application: it shows the toolbar while the pointer is over the message.
const RevealedOnHover = () => {
	const [visible, setVisible] = useState(false);

	return (
		<Box onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
			<MessageWithToolbar visible={visible} />
		</Box>
	);
};

// jsdom loads no stylesheet, so the computed styles are asserted in the browser run only.
const inBrowser = () => !navigator.userAgent.includes('jsdom');

const wrapperOf = (canvasElement: HTMLElement) => canvasElement.querySelector('.rcx-message-toolbar__wrapper') as HTMLElement;

export const Default: Story = {
	render: () => <RevealedOnHover />,
};

export const Visible: Story = {
	render: () => <MessageWithToolbar visible />,
};

export const RevealedByTheApplication: Story = {
	tags: ['g0', '!autodocs'],
	render: () => <RevealedOnHover />,
	play: async ({ canvasElement }) => {
		const wrapper = wrapperOf(canvasElement);
		const message = canvasElement.querySelector('.rcx-message') as HTMLElement;

		await expect(wrapper).not.toHaveClass('rcx-message-toolbar__wrapper--visible');
		await userEvent.hover(message);
		await expect(wrapper).toHaveClass('rcx-message-toolbar__wrapper--visible');
		await userEvent.unhover(message);
		await expect(wrapper).not.toHaveClass('rcx-message-toolbar__wrapper--visible');
	},
};

export const HiddenAtRest: Story = {
	tags: ['g0', '!autodocs'],
	render: () => <MessageWithToolbar visible={false} />,
	play: async ({ canvasElement }) => {
		const wrapper = wrapperOf(canvasElement);

		await expect(wrapper).not.toHaveClass('rcx-message-toolbar__wrapper--visible');
		if (inBrowser()) await expect(getComputedStyle(wrapper).display).toBe('none');
	},
};

export const Overlay: Story = {
	tags: ['g0', '!autodocs'],
	render: () => (
		<Box style={{ width: 500, paddingTop: 40 }}>
			<MessageWithToolbar visible />
		</Box>
	),
	play: async ({ canvasElement }) => {
		const wrapper = wrapperOf(canvasElement);
		await expect(wrapper).toHaveClass('rcx-message-toolbar__wrapper--visible');
		if (!inBrowser()) return;

		const toolbar = wrapper.querySelector('.rcx-message-toolbar') as HTMLElement;
		const message = canvasElement.querySelector('.rcx-message') as HTMLElement;

		await expect(getComputedStyle(wrapper).position).toBe('absolute');
		await expect(getComputedStyle(toolbar).position).toBe('absolute');
		await expect(getComputedStyle(toolbar).zIndex).toBe('10');
		await expect(getComputedStyle(toolbar).top).toBe('-24px');
		await expect(wrapper.getBoundingClientRect().right).toBe(message.getBoundingClientRect().right - 20);
	},
};
