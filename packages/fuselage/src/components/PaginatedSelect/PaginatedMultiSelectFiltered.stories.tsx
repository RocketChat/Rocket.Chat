import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';

import PaginatedMultiSelectFiltered from './PaginatedMultiSelectFiltered';

export default {
	title: 'Inputs/PaginatedMultiSelectFiltered',
	component: PaginatedMultiSelectFiltered,
	args: {
		placeholder: 'Placeholder here...',
		options: Array.from({ length: 1000 }, (_, i) => ({
			value: i,
			label: `Item #${i}`,
		})),
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	argTypes: {
		options: {
			control: false,
			description: 'List of `{ value, label }` options rendered as selectable chips in the paginated dropdown.',
			table: { category: 'Content' },
		},
		value: {
			control: false,
			description: 'Controlled list of currently selected options; each entry must match one of `options`.',
			table: { category: 'State' },
		},
		placeholder: {
			control: 'text',
			description: 'Placeholder text shown in the filter input when no filter text has been typed.',
			table: { category: 'Content' },
		},
		withTitle: {
			control: 'boolean',
			description: 'Sets the `title` attribute on each selected chip so the full label is shown on hover when truncated.',
			table: { category: 'Content' },
		},
		filter: {
			control: 'text',
			description: 'Current filter text used to narrow down the list of options shown in the dropdown.',
			table: { category: 'State' },
		},
		setFilter: {
			control: false,
			description: 'Called with the new text whenever the user types into the filter input.',
			table: { category: 'Events' },
		},
		error: {
			control: 'boolean',
			description: 'Renders the field with the invalid style state.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the field and blocks pointer interaction.',
			table: { category: 'State' },
		},
		onChange: {
			control: false,
			description: 'Called with the updated list of selected options whenever an option is added or removed.',
			table: { category: 'Events' },
		},
		endReached: {
			control: false,
			description:
				'Called with the visible `start`/`end` indexes when the dropdown list is scrolled near its end, used to fetch more paginated options.',
			table: { category: 'Events' },
		},
		anchor: {
			control: false,
			description:
				'Overrides the trigger element rendered inside the field (defaults to `SelectFocus`); `PaginatedMultiSelectFiltered` replaces it internally with a filter `Input`.',
			table: { category: 'Content' },
		},
		renderOptions: {
			control: false,
			description: 'Overrides the component that renders the dropdown list of options (defaults to `OptionsPaginated`).',
			table: { category: 'Content' },
		},
		renderItem: {
			control: false,
			description: 'Overrides the component used to render each option row (defaults to `Option`).',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof PaginatedMultiSelectFiltered>;

type Story = StoryObj<typeof PaginatedMultiSelectFiltered>;

export const Normal: Story = {
	render: (args) => {
		const [, updateArgs] = useArgs();

		return <PaginatedMultiSelectFiltered setFilter={(filter) => updateArgs({ filter })} {...args} />;
	},
};

export const Errored: Story = {
	args: {
		error: true,
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};
