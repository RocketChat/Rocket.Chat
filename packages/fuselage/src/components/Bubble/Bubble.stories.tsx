import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import Bubble from './Bubble';

export default {
	title: 'Data Display/Bubble',
	component: Bubble,
	parameters: {
		docs: {
			description: {
				component:
					'Floating control used in a scrollable feed or dynamic menu without pagination.\n\n' +
					'**Rules**\n' +
					'- Use in scrollable feeds or dynamic menus without pagination.\n' +
					'- Position: 8px below the top of the feed/menu, 8px above the bottom, 8px between two bubbles in the same space.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Content of the bubble.',
			table: { category: 'Content' },
		},
		icon: {
			control: 'text',
			description: 'Name of the Fuselage icon rendered before the label.',
			table: { category: 'Content' },
		},
		secondary: {
			control: 'boolean',
			description: 'Muted, lower-emphasis visual style.',
			table: { category: 'Kind' },
		},
		small: {
			control: 'boolean',
			description: 'Small size scale.',
			table: { category: 'Size' },
		},
		onClick: {
			control: false,
			description: 'Called when the label is activated. When set, the label renders as a button.',
			table: { category: 'Events' },
		},
		onDismiss: {
			control: false,
			description: 'Called when the dismiss button is activated. When set, a dismiss button is rendered.',
			table: { category: 'Events' },
		},
		contentProps: {
			control: false,
			description: 'Extra button attributes forwarded to the clickable label element.',
			table: { category: 'Content' },
		},
		dismissProps: {
			control: false,
			description: 'Extra button attributes forwarded to the dismiss button element.',
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
				story: 'Example with only a dismiss action - the label is not clickable.',
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
