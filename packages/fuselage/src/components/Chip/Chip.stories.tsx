import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { exampleAvatar, blankAvatar } from '../../../.storybook/helpers';
import { Box } from '../Box';
import { Margins } from '../Margins';
import Chip from './Chip';

export default {
	title: 'Data Display/Chip',
	component: Chip,
	parameters: {
		docs: {
			usage: `
- Always give the chip a label.
- Lead with one thumbnail at most: an avatar from \`thumbUrl\`, or an icon through \`renderThumb\`.
- Keep the dismiss symbol, by setting \`onClick\`, when the chip stands for a selection the user can remove.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		thumbUrl: {
			control: 'text',
			table: { category: 'Content' },
		},
		renderThumb: {
			control: false,
			table: { category: 'Content' },
		},
		renderDismissSymbol: {
			control: false,
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			table: { category: 'Appearance' },
		},
		label: {
			control: 'boolean',
			table: { category: 'Appearance' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		onClick: {
			control: false,
			description:
				'Called when the chip is clicked, to remove it. Without it or `onMouseDown`, the chip is disabled and shows no dismiss symbol.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof Chip>;

type Story = StoryObj<typeof Chip>;

export const Default: Story = {
	args: {
		children: 'Marie Rowe',
	},
};

export const WithThumbUrl: Story = {
	args: {
		children: 'Marie Rowe',
		thumbUrl: exampleAvatar,
		onClick: action('click'),
	},
};

export const Dismissible: Story = {
	args: {
		children: 'Marie Rowe',
		onClick: action('click'),
	},
};

export const Disabled: Story = {
	args: {
		children: 'Marie Rowe',
		disabled: true,
	},
};

export const Small: Story = {
	args: {
		children: 'Marie Rowe',
		small: true,
		onClick: action('click'),
	},
};

export const Label: Story = {
	args: {
		children: 'Productivity',
		label: true,
	},
};

export const WithThumb: Story = {
	render: () => (
		<Box display='flex' margin='-x4'>
			<Margins all='x4'>
				<Chip thumbUrl={blankAvatar}>Chip</Chip>
				<Chip thumbUrl={blankAvatar} onClick={action('click')}>
					Chip
				</Chip>
			</Margins>
		</Box>
	),
};
