import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';

import { Box } from '../Box';
import { Option } from '../Option';
import type { OptionsPaginatedProps } from './OptionsPaginated';
import { CheckOption, OptionsPaginated } from './OptionsPaginated';

export default {
	title: 'Navigation/Options/OptionsPaginated',
	component: OptionsPaginated,
	argTypes: {
		multiple: {
			control: 'boolean',
			table: { category: 'Selection' },
		},
		options: {
			control: false,
			table: { category: 'Content' },
		},
		cursor: {
			control: 'number',
			table: { category: 'State' },
		},
		withTitle: {
			control: 'boolean',
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			table: { category: 'Content' },
		},
		renderEmpty: {
			control: false,
			table: { category: 'Content' },
		},
		onSelect: {
			control: false,
			table: { category: 'Events' },
		},
		endReached: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof OptionsPaginated>;

type Story = StoryObj<typeof OptionsPaginated>;

const options: OptionsPaginatedProps['options'] = Array.from({
	length: 90,
}).map((_: unknown, i: number) => ({
	value: 1 + i,
	label: `a test ${i + 1}`,
}));

export const Default: Story = {
	args: {
		cursor: 1,
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<OptionsPaginated {...args} ref={createRef()} options={options} />
		</Box>
	),
};

export const OptionStory: Story = {
	name: 'Option',
	args: {
		cursor: 1,
		renderItem: Option,
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<OptionsPaginated {...args} ref={createRef()} options={options} />
		</Box>
	),
};

export const CheckOptionStory: Story = {
	name: 'CheckOption',
	args: {
		cursor: 0,
		renderItem: CheckOption,
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<OptionsPaginated {...args} ref={createRef()} options={options} />
		</Box>
	),
};
