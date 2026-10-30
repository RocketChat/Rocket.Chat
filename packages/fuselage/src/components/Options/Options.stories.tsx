import type { Meta, StoryObj } from '@storybook/react-vite';
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
			description: 'Marks the listbox as supporting multiple selection (sets `aria-multiselectable`); defaults to `true` when unset.',
			table: { category: 'Selection' },
		},
		options: {
			control: false,
			description:
				'List of `[value, label, selected?, disabled?, type?, url?]` tuples; entries with `type` `heading` or `divider` render as `OptionHeader`/`OptionDivider`, others render via `renderItem`.',
			table: { category: 'Content' },
		},
		cursor: {
			control: 'number',
			description: 'Index of the option currently focused via keyboard navigation; the list auto-scrolls it into view.',
			table: { category: 'State' },
		},
		renderItem: {
			control: false,
			description: 'Component used to render each selectable option (defaults to `Option`).',
			table: { category: 'Content' },
		},
		renderEmpty: {
			control: false,
			description: 'Component rendered in place of the list when `options` is empty (defaults to `OptionsEmpty`).',
			table: { category: 'Content' },
		},
		onSelect: {
			control: false,
			description: 'Called with the selected option tuple when a non-disabled option is clicked.',
			table: { category: 'Events' },
		},
		customEmpty: {
			control: 'text',
			description: "Text forwarded to the empty-state component's `customEmpty` prop.",
			table: { category: 'Content' },
		},
		maxHeight: {
			control: 'text',
			description: 'Maximum height of the scrollable options list (defaults to `x144`).',
			table: { category: 'Layout' },
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
