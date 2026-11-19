import type { Meta, StoryObj } from '@storybook/react';
import { createRef, type ReactNode } from 'react';

import { Options, type OptionType } from '.';
import { Box } from '../Box';
import { Option, CheckOption } from '../Option';

export default {
	title: 'Navigation/Options',
	component: Options,
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
		customEmpty: {
			control: 'text',
			table: { category: 'Content' },
		},
		maxHeight: {
			control: 'text',
			table: { category: 'Layout', defaultValue: { summary: '144px' } },
		},
	},
} satisfies Meta<typeof Options<string | number, ReactNode>>;

type Story = StoryObj<typeof Options<string | number, ReactNode>>;

const options: OptionType[] = [
	[1, 'a teste 1'],
	[2, 'b teste 2'],
	[3, 'c teste 3', true],
	[4, 'd testeadsasdasdasdasdjhasjfhasdkjfhaskdfjhkasjdfhkasjdhfkasjdhfkasjdhfkasjdhfkasdjhfkasdjhfaksjdfhkasjdh 4'],
];

export const Default: Story = {
	args: {
		cursor: 1,
		options,
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<Options {...args} ref={createRef()} />
		</Box>
	),
};

export const OptionStory: Story = {
	name: 'Option',
	args: {
		renderItem: Option,
		cursor: 1,
		options,
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<Options {...args} ref={createRef()} />
		</Box>
	),
};

export const CheckOptionStory: Story = {
	name: 'CheckOption',
	args: {
		renderItem: CheckOption,
		cursor: 0,
		options,
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<Options {...args} ref={createRef()} />
		</Box>
	),
};

export const EmptyOptions: Story = {
	args: {
		cursor: 1,
		options: [],
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<Options {...args} ref={createRef()} />
		</Box>
	),
};

export const CustomEmpty: Story = {
	args: {
		cursor: 1,
		options: [],
		customEmpty: 'Custom empty placeholder',
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<Options {...args} ref={createRef()} />
		</Box>
	),
};

export const Grouped: Story = {
	args: {
		cursor: 1,
		options: [
			['recent', 'Recent', false, false, 'heading'],
			[1, 'a teste 1'],
			[2, 'b teste 2'],
			['divider', '', false, false, 'divider'],
			['all', 'All', false, false, 'heading'],
			[3, 'c teste 3', true],
			[4, 'd teste 4'],
		],
	},
	render: (args) => (
		<Box position='relative' maxWidth={250}>
			<Options {...args} ref={createRef()} />
		</Box>
	),
};
