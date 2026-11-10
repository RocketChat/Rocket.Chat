import { Button, Select } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import FilterBar from './FilterBar';
import FilterBarFilters from './FilterBarFilters';
import FilterBarSearch from './FilterBarSearch';

const meta = {
	component: FilterBar,
	decorators: [mockAppRoot().buildStoryDecorator()],
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const options: [string, string][] = [
	['all', 'All'],
	['some', 'Some'],
];

export const SearchOnly: Story = {
	args: {
		children: <FilterBarSearch placeholder='Search apps' />,
	},
};

export const WithFilters: Story = {
	args: {
		children: (
			<>
				<FilterBarSearch placeholder='Search apps' />
				<FilterBarFilters>
					<Select aria-label='Price' options={options} value='all' onChange={() => undefined} />
					<Select aria-label='Status' options={options} value='all' onChange={() => undefined} />
					<Select aria-label='Category' options={options} value='all' onChange={() => undefined} />
					<Select aria-label='Sort' options={options} value='all' onChange={() => undefined} />
				</FilterBarFilters>
			</>
		),
	},
};

export const WithAction: Story = {
	args: {
		children: (
			<>
				<FilterBarSearch placeholder='Search contacts' />
				<Button variant='primary'>New contact</Button>
			</>
		),
	},
};

export const Compact: Story = {
	args: {
		compact: true,
		children: (
			<>
				<FilterBarSearch placeholder='Search by username' />
				<FilterBarFilters>
					<Select aria-label='Status' options={options} value='all' onChange={() => undefined} />
				</FilterBarFilters>
			</>
		),
	},
	decorators: [
		(Story) => (
			<div style={{ width: 352 }}>
				<Story />
			</div>
		),
	],
};
