import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';

import type { OptionType } from './OptionType';
import Options from './Options';
import { Listbox, ListboxOption } from '../Listbox';

// G0 characterization of how the option lists are sized: a closed set of heights on Options, and no inline size on a
// list that nothing places; see src/testing/README.md.
export default {
	title: 'Characterization/Options/Sizing',
	component: Options,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Options>;

type Story = StoryObj<typeof Options>;

const options: OptionType[] = [
	[1, 'Alpha'],
	[2, 'Bravo'],
];
const onSelect = fn();

export const MaxHeight: Story = {
	render: () => (
		<>
			<Options aria-label='default' options={options} cursor={-1} onSelect={onSelect} />
			<Options aria-label='x200' maxHeight='x200' options={options} cursor={-1} onSelect={onSelect} />
			<Options aria-label='content' maxHeight='max-content' options={options} cursor={-1} onSelect={onSelect} />
		</>
	),
	play: async ({ canvasElement }) => {
		const [regular, x200, content] = within(canvasElement).getAllByRole('listbox');
		await expect(regular).not.toHaveClass('rcx-options__list--x200', 'rcx-options__list--max-content');
		await expect(x200).toHaveClass('rcx-options__list--x200');
		await expect(content).toHaveClass('rcx-options__list--max-content');
		for (const list of [regular, x200, content]) {
			await expect(list).not.toHaveAttribute('style');
		}
	},
};

export const ListboxReset: Story = {
	render: () => (
		<Listbox id='sizing-listbox' aria-label='List'>
			<ListboxOption id='sizing-option'>Alpha</ListboxOption>
		</Listbox>
	),
	play: async ({ canvasElement }) => {
		const list = within(canvasElement).getByRole('listbox', { name: 'List' });
		await expect(list.tagName).toBe('UL');
		await expect(list).toHaveClass('rcx-listbox');
		await expect(within(list).getAllByRole('option')).toHaveLength(1);
	},
};
