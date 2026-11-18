import type { Meta, StoryObj } from '@storybook/react';
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
	parameters: {
		docs: {
			usage: `
- Follows the \`TextInput\` usage.
`,
		},
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
			table: { category: 'Kind' },
		},
		startAddon: {
			control: false,
			table: { category: 'Content' },
		},
		endAddon: {
			control: false,
			table: { category: 'Content' },
		},
		endAddonFlush: {
			control: 'boolean',
			table: { category: 'Content' },
		},
		input: {
			control: false,
			table: { category: 'Content' },
		},
		multiple: {
			control: 'boolean',
			table: { category: 'Content' },
		},
		placeholder: {
			control: 'text',
			table: { category: 'Content' },
		},
		small: {
			control: 'boolean',
			table: { category: 'Size' },
		},
		error: {
			control: 'text',
			table: { category: 'State' },
		},
		placeholderVisible: {
			control: 'boolean',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		value: {
			control: 'text',
			table: { category: 'Content' },
		},
		defaultValue: {
			control: 'text',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
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
	parameters: {
		docs: {
			description: {
				story: "Click the calendar icon to open the browser's date picker.",
			},
		},
	},
};

export const Time: Story = {
	args: {
		'aria-label': 'Value',
		'defaultValue': 'Value',
		'onChange': action('change'),
		'type': 'time',
	},
	parameters: {
		docs: {
			description: {
				story: "Click the clock icon to open the browser's time picker.",
			},
		},
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
