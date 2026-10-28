import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { exampleAvatar, DECORATOR_LABEL } from '../../../.storybook/helpers';
import { Avatar } from '../Avatar';
import { Box } from '../Box';
import { Chip } from '../Chip';
import { Option } from '../Option';
import type { AutoCompleteProps } from './AutoComplete';
import AutoComplete from './AutoComplete';

export default {
	title: 'Inputs/AutoComplete',
	component: AutoComplete,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		value: {
			control: 'text',
			description: 'Currently selected option value(s); a string for single selection or an array of strings when `multiple`.',
			table: { category: 'State' },
		},
		filter: {
			control: 'text',
			description: 'Current text typed into the input, used to filter the options list.',
			table: { category: 'State' },
		},
		setFilter: {
			control: false,
			description: 'Called when the input text changes, to update `filter`.',
			table: { category: 'Events' },
		},
		options: {
			control: false,
			description: 'List of selectable options (`{ value, label }`) shown in the dropdown.',
			table: { category: 'Content' },
		},
		renderSelected: {
			control: false,
			description: 'Custom renderer for each selected value.',
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			description: 'Custom renderer for each option row in the dropdown.',
			table: { category: 'Content' },
		},
		renderEmpty: {
			control: false,
			description: 'Custom renderer shown when no options match the filter.',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			description: 'Called with the new selected value(s) when the selection changes.',
			table: { category: 'Events' },
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text shown in the input when it is empty.',
			table: { category: 'Content' },
		},
		error: {
			control: 'boolean',
			description: 'Renders the input in an invalid/error state.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the input and blocks interaction.',
			table: { category: 'State' },
		},
		multiple: {
			control: 'boolean',
			description: 'Allows selecting more than one option at a time.',
			table: { category: 'Kind' },
		},
	},
} satisfies Meta<typeof AutoComplete<ReactNode>>;

type Story = StoryObj<typeof AutoComplete<ReactNode>>;

const options = [
	{ value: '1', label: 'test1' },
	{ value: '2', label: 'test2' },
	{ value: '3', label: 'test3' },
	{ value: '4', label: 'test4' },
];

const AutoCompleteDemo = ({ value: defaultValue, ...args }: Partial<AutoCompleteProps<ReactNode>>) => {
	const [filter, setFilter] = useState('');
	const [value, setValue] = useState<string | string[]>(defaultValue || []);

	const handleChangeRooms = (value: string | string[]) => setValue(value);

	return (
		<AutoComplete
			{...args}
			value={value}
			filter={filter}
			setFilter={setFilter}
			options={options}
			onChange={handleChangeRooms}
			aria-label={DECORATOR_LABEL}
		/>
	);
};

export const Default: Story = {
	render: (args) => <AutoCompleteDemo {...args} />,
};

export const CustomSelected: Story = {
	args: {
		value: '1',
		renderSelected: ({ selected: { label } }) => (
			<Box>
				<Avatar size='x20' url={exampleAvatar} aria-hidden /> {label}
			</Box>
		),
	},
	render: (args) => <AutoCompleteDemo {...args} />,
};

export const Multiple: Story = {
	args: {
		value: ['1', '3'],
		multiple: true,
	},
	render: (args) => <AutoCompleteDemo {...args} />,
};

export const MultipleCustomSelected: Story = {
	args: {
		value: ['1', '3'],
		multiple: true,
		renderSelected: ({ selected: { value, label }, onRemove }) => (
			<Chip key={value} value={value} onClick={onRemove}>
				<Box is='span' margin='none' marginInlineStart={4}>
					<Avatar size='x20' url={exampleAvatar} aria-hidden />
					{'  '}
					{label}
				</Box>
			</Chip>
		),
	},
	render: (args) => <AutoCompleteDemo {...args} />,
};

export const CustomItem: Story = {
	args: {
		renderItem: ({ value, label, ...props }) => (
			<Option {...props} key={value} label={label} avatar={<Avatar size='x20' url={exampleAvatar} aria-hidden />} />
		),
	},
	render: (args) => <AutoCompleteDemo {...args} />,
};

export const WithPlaceholder: Story = {
	args: {
		placeholder: 'Search...',
	},
	render: (args) => <AutoCompleteDemo {...args} />,
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
	render: (args) => <AutoCompleteDemo {...args} />,
};
