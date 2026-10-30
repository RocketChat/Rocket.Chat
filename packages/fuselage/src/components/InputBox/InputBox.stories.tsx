import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import { Input, InputBox, InputBoxSkeleton } from '.';
import { Box } from '../Box';
import { Button } from '../Button';
import { Icon } from '../Icon';

export default {
	title: 'Inputs/InputBox',
	component: InputBox,
	subcomponents: {
		InputBoxSkeleton,
		Input,
	},
	argTypes: {
		type: {
			control: 'select',
			options: [
				'button',
				'checkbox',
				'color',
				'date',
				'datetime',
				'datetime-local',
				'email',
				'file',
				'hidden',
				'image',
				'month',
				'number',
				'password',
				'radio',
				'range',
				'reset',
				'search',
				'submit',
				'tel',
				'text',
				'time',
				'url',
				'week',
				'textarea',
				'select',
			],
			description: 'HTML input type (or `textarea`/`select`) to render.',
			table: { category: 'Kind' },
		},
		startAddon: {
			control: false,
			description: 'Content rendered before the input, inside its border.',
			table: { category: 'Content' },
		},
		endAddon: {
			control: false,
			description: 'Content rendered after the input, inside its border.',
			table: { category: 'Content' },
		},
		endAddonFlush: {
			control: 'boolean',
			description: 'Reduces the end padding so a button in `endAddon` sits flush with the input edge.',
			table: { category: 'Content' },
		},
		multiple: {
			control: 'boolean',
			description: 'Allows multiple values to be entered/selected.',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text shown when the input is empty.',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			description: 'Renders the input at a smaller size scale.',
			table: { category: 'Size' },
		},
		error: {
			control: 'text',
			description: 'Error message that marks the input as invalid and styles it accordingly.',
			table: { category: 'State' },
		},
		placeholderVisible: {
			control: 'boolean',
			description: 'Keeps the placeholder visible even when there is a value.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the input and blocks pointer interaction.',
			table: { category: 'State' },
		},
		value: {
			control: 'text',
			description: 'Controlled value of the input.',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'text',
			description: 'Initial, uncontrolled value of the input.',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			description: 'Called when the input value changes.',
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof InputBox>;

type Story = StoryObj<typeof InputBox>;

export const Default: Story = {
	args: {
		'aria-label': 'Value',
		'defaultValue': 'Value',
		'onChange': action('change'),
	},
};

export const Date: Story = {
	args: {
		'aria-label': 'Value',
		'defaultValue': 'Value',
		'onChange': action('change'),
		'type': 'date',
	},
};

export const Time: Story = {
	args: {
		'aria-label': 'Value',
		'defaultValue': 'Value',
		'onChange': action('change'),
		'type': 'time',
	},
};

export const WithAddon: Story = {
	args: {
		'aria-label': 'Value',
		'endAddon': <Icon name='send' size='x20' />,
	},
};

export const WithFlushEndAddon: Story = {
	args: {
		'aria-label': 'Value',
		'endAddonFlush': true,
		'endAddon': (
			<Button icon='upload' size='small' variant='primary'>
				Browse
			</Button>
		),
	},
};

export const WithStartAddon: Story = {
	args: {
		'aria-label': 'Value',
		'startAddon': <Icon name='send' size='x20' />,
	},
};

export const Invalid: Story = {
	args: {
		'aria-label': 'Value',
		'defaultValue': 'Value',
		'error': 'Error',
		'onChange': action('change'),
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': 'Value',
		'defaultValue': 'Value',
		'disabled': true,
		'onChange': action('change'),
	},
};

export const WithPlaceholder: Story = {
	args: {
		'aria-label': 'Value',
		'placeholder': 'Placeholder',
		'onChange': action('change'),
	},
};

export const Skeleton: Story = {
	name: 'InputBoxSkeleton',
	render: () => <InputBoxSkeleton />,
};

export const SmallVariants: Story = {
	args: {
		placeholder: 'Search',
		small: true,
		onChange: action('change'),
	},
	render: () => (
		<Box display='flex' flexDirection='column' alignItems='flex-start' style={{ gap: '8px' }}>
			<InputBox type='text' small placeholder='Name' aria-label='Name' />
			<InputBox type='text' small placeholder='Search' endAddon={<Icon name='magnifier' size='x20' />} aria-label='Search' />
		</Box>
	),
};
