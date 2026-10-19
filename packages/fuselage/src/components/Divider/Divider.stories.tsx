import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { IconButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import Divider from './Divider';

export default {
	title: 'Data Display/Divider',
	component: Divider,
	parameters: {
		docs: {
			description: {
				component:
					'Separates sections of content.\n\n' +
					'**Rules**\n' +
					'- Use inset to separate related content within a wrapper.\n' +
					'- For a full-width stroke (e.g. separating a header from page content), use a border, not a divider.\n' +
					'- Vertical dividers are used between things like a menu and composer; horizontal + text is used e.g. on a login page.',
			},
		},
	},
	argTypes: {
		variation: {
			control: 'select',
			options: ['danger'],
			description: 'Color variation of the divider.',
			table: { category: 'Kind' },
		},
		vertical: {
			control: 'boolean',
			description: 'Renders the divider along the vertical axis instead of horizontal.',
			table: { category: 'Layout' },
		},
		children: {
			control: 'text',
			description: 'Text rendered inside the divider; when set, the divider renders as a labeled separator instead of a plain `hr`.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Divider>;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {};

export const WithText: Story = {
	args: {
		children: 'Divider',
	},
};

export const Vertical: Story = {
	args: {
		vertical: true,
	},
};

export const AsButtonSeparator: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton small icon='phone' />
			<Divider vertical />
			<IconButton small icon='user' />
		</ButtonGroup>
	),
};
