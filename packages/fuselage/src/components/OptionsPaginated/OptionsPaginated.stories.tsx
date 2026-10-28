import type { Meta, StoryObj } from '@storybook/react-vite';
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
			description:
				"Selection mode passed to each rendered item; when not `true`, an unselected item's `selected` prop falls back to `undefined` instead of `false`.",
			table: { category: 'Selection' },
		},
		options: {
			control: false,
			description: 'List of `{ value, label, selected? }` items rendered virtualized (via `react-virtuoso`).',
			table: { category: 'Content' },
		},
		cursor: {
			control: 'number',
			description: 'Index of the option currently focused via keyboard navigation.',
			table: { category: 'State' },
		},
		withTitle: {
			control: 'boolean',
			description: "Passes each item's label as the rendered item's `title` attribute (tooltip).",
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			description: 'Component used to render each option (defaults to `Option`).',
			table: { category: 'Content' },
		},
		renderEmpty: {
			control: false,
			description: "Component rendered in place of the list when `options` is empty (defaults to `Empty`, an `Option label='Empty'`).",
			table: { category: 'Content' },
		},
		onSelect: {
			control: false,
			description: 'Called with `[value, label]` when an item is selected.',
			table: { category: 'Events' },
		},
		endReached: {
			control: false,
			description: 'Called by the underlying virtualized list when scrolling reaches the end, for paginated/infinite loading.',
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
