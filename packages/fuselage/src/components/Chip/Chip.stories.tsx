import type { Meta, StoryObj } from '@storybook/react-vite';
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
			description: {
				component:
					'Used to communicate and manage input-field selections.\n\n' +
					'**Rules**\n' +
					'- Text is mandatory.\n' +
					'- A chip may have either a leading icon or a leading avatar — not both.\n' +
					'- Keep the close button when the chip represents a removable selection.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Chip label content.',
			table: { category: 'Content' },
		},
		thumbUrl: {
			control: 'text',
			description: 'URL of the avatar image rendered before the label.',
			table: { category: 'Content' },
		},
		renderThumb: {
			control: false,
			description: 'Custom renderer for the thumbnail, receiving `{ url }`.',
			table: { category: 'Content' },
		},
		renderDismissSymbol: {
			control: false,
			description: 'Custom renderer for the dismiss icon.',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Renders a 20px tall chip.',
			table: { category: 'Appearance' },
		},
		label: {
			control: 'boolean',
			description: 'Renders the text in uppercase, for chips that categorize rather than select.',
			table: { category: 'Appearance' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the chip and blocks pointer interaction.',
			table: { category: 'State' },
		},
		onClick: {
			control: false,
			description: 'Called when the chip is clicked; the dismiss symbol is only rendered when this (or `onMouseDown`) is provided.',
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
