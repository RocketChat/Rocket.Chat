import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import Bubble from './Bubble';

export default {
	title: 'Data Display/Bubble',
	component: Bubble,
	parameters: {
		docs: {
			usage: `
- Use it in scrollable feeds and in dynamic menus without pagination.
- Place it 8px below the top or 8px above the bottom of the feed or menu, and 8px apart from another bubble in the same space.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		icon: {
			control: 'text',
			table: { category: 'Content' },
		},
		secondary: {
			control: 'boolean',
			table: { category: 'Kind' },
		},
		small: {
			control: 'boolean',
			table: { category: 'Size' },
		},
		onClick: {
			control: false,
			table: { category: 'Events' },
		},
		onDismiss: {
			control: false,
			table: { category: 'Events' },
		},
		contentProps: {
			control: false,
			table: { category: 'Content' },
		},
		dismissProps: {
			control: false,
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Bubble>;

type Story = StoryObj<typeof Bubble>;

export const IconAndLabel: Story = {
	args: {
		children: 'New messages',
		onClick: action('click'),
		icon: 'arrow-down',
	},
};

export const Dismissable: Story = {
	args: {
		children: 'New messages',
		icon: 'arrow-down',
		onClick: action('click'),
		onDismiss: action('dismiss'),
	},
};

export const LabelOnly: Story = {
	args: {
		children: 'See new messages',
		onClick: action('click'),
	},
};

export const Secondary: Story = {
	args: {
		children: 'See new messages',
		secondary: true,
		onClick: action('click'),
	},
};

export const SecondaryDismissable: Story = {
	args: {
		children: 'New messages',
		secondary: true,
		onDismiss: action('dismiss'),
	},
	parameters: {
		docs: {
			description: {
				story: 'With `onDismiss` and no `onClick`, only the close button can be pressed.',
			},
		},
	},
};

export const WithoutAction: Story = {
	args: {
		children: '22 Nov 2023',
		secondary: true,
	},
};

export const WithLargeText: Story = {
	args: {
		children:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vestibulum libero viverra nulla varius, a consequat ante malesuada. Fusce bibendum, lacus sed fermentum sagittis, urna erat viverra lacus, eu pellentesque neque est nec nisl. Morbi in lobortis dui, ac consectetur mi.',
		secondary: true,
		onClick: action('click'),
	},
};

export const Small: Story = {
	args: {
		children: '22 Nov 2023',
		secondary: true,
		small: true,
	},
};
