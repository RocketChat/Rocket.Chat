import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import { CheckOption, Empty, OptionsPaginated } from './OptionsPaginated';

// G0 characterization of OptionsPaginated on its develop implementation. The rows are virtualized, so a jsdom run with no
// layout renders none: what the specs assert about rows holds only where the list measured a height. A rewrite passes these
// unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/OptionsPaginated',
	component: OptionsPaginated,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof OptionsPaginated>;

type Story = StoryObj<typeof OptionsPaginated>;

const onSelect = fn();

export const EmptyState: Story = {
	render: () => (
		<>
			<OptionsPaginated options={[]} cursor={0} onSelect={onSelect} />
			<OptionsPaginated options={[]} cursor={0} onSelect={onSelect} renderEmpty={() => <p id='custom-empty'>Nothing</p>} />
		</>
	),
	play: async ({ canvasElement }) => {
		const rows = canvasElement.querySelectorAll('li.rcx-option');
		await expect(rows).toHaveLength(1);
		await expect(rows[0]).toHaveTextContent('Empty');
		await expect(canvasElement.querySelector('#custom-empty')).not.toBeNull();
	},
};

export const ExportedParts: Story = {
	render: () => (
		<ul>
			<Empty />
			<CheckOption id='check' selected>
				Check
			</CheckOption>
		</ul>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#check')).toHaveAttribute('aria-selected', 'true');
		await expect(canvasElement.querySelector('#check input')).toBeChecked();
		await expect(canvasElement.querySelectorAll('li.rcx-option')).toHaveLength(2);
	},
};
