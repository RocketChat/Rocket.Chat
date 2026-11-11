import type { Meta, StoryObj } from '@storybook/react';
import { createRef, useState } from 'react';
import { expect, fireEvent, fn, userEvent } from 'storybook/test';

import Listbox from './Listbox';
import ListboxOption from './ListboxOption';
import { ariaSnapshot, classContract, expectCombobox, expectForwards } from '../../testing/g0';

// G0 characterization of Listbox and ListboxOption on their develop implementation, driven by a combobox that keeps the
// focus and moves `aria-activedescendant`. A rewrite passes these unedited, in jest and in the compiled zero-runtime
// Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Listbox',
	component: Listbox,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Listbox>;

type Story = StoryObj<typeof Listbox>;

const listRef = createRef<HTMLUListElement>();

export const ListboxForwarding: Story = {
	render: () => (
		<Listbox
			id='list-id'
			ref={listRef}
			className='consumer-class'
			title='list title'
			data-qa='list-qa'
			data-anything='anything'
			aria-label='list label'
			onMouseEnter={fn()}
		>
			<ListboxOption id='only'>Only</ListboxOption>
		</Listbox>
	),
	play: async ({ canvasElement }) => {
		const list = canvasElement.querySelector('ul') as HTMLElement;
		await expectForwards(canvasElement, list, {
			'id': 'list-id',
			'className': 'consumer-class',
			'title': 'list title',
			'data-qa': 'list-qa',
			'data-anything': 'anything',
			'aria-label': 'list label',
			'ref': listRef,
		});
		await expect(list).toHaveAttribute('role', 'listbox');
		await expect(list).toHaveClass('rcx-listbox');
	},
};

const onActivate = fn();
const onSelect = fn();

export const OptionBehavior: Story = {
	render: () => (
		<Listbox id='behavior'>
			<ListboxOption id='idle' onActivate={onActivate} onSelect={onSelect}>
				Idle
			</ListboxOption>
			<ListboxOption id='active' active onActivate={onActivate} onSelect={onSelect}>
				Active
			</ListboxOption>
			<ListboxOption id='active-visible' active focusVisible onActivate={onActivate}>
				Active visible
			</ListboxOption>
			<ListboxOption id='selected' selected>
				Selected
			</ListboxOption>
			<ListboxOption id='disabled' disabled onActivate={onActivate} onSelect={onSelect}>
				Disabled
			</ListboxOption>
		</Listbox>
	),
	play: async ({ canvasElement }) => {
		const get = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		await expect(get('idle').tagName).toBe('LI');
		await expect(get('idle')).toHaveAttribute('role', 'option');
		await expect(get('idle')).toHaveClass('rcx-option');
		await expect(get('idle')).toHaveAttribute('aria-selected', 'false');
		await expect(get('selected')).toHaveAttribute('aria-selected', 'true');
		await expect(get('disabled')).toHaveAttribute('aria-disabled', 'true');
		await expect(get('active')).toHaveClass('rcx-option--focus');
		await expect(get('active')).not.toHaveClass('rcx-item--focus-visible');
		await expect(get('active-visible')).toHaveClass('rcx-item--focus-visible');
		await expect(get('idle')).not.toHaveClass('rcx-option--focus');

		onActivate.mockClear();
		await userEvent.hover(get('idle'));
		await expect(onActivate).toHaveBeenCalledTimes(1);
		onActivate.mockClear();
		await userEvent.hover(get('active'));
		await expect(onActivate).not.toHaveBeenCalled();
		await userEvent.hover(get('active-visible'));
		await expect(onActivate).toHaveBeenCalledTimes(1);
		onActivate.mockClear();
		await userEvent.hover(get('disabled'));
		await expect(onActivate).not.toHaveBeenCalled();

		onSelect.mockClear();
		await userEvent.click(get('idle'));
		await expect(onSelect).toHaveBeenCalledTimes(1);
		await userEvent.click(get('disabled'));
		await expect(onSelect).toHaveBeenCalledTimes(1);

		// pressing an option must leave the focus on the combobox
		// fireEvent returns false when a handler prevented the default
		await expect(await fireEvent.pointerDown(get('idle'))).toBe(false);
	},
};

const items = ['Alpha', 'Bravo', 'Charlie'];
const onPick = fn();

const Combobox = () => {
	const [active, setActive] = useState(-1);
	return (
		<>
			<input
				id='combo'
				role='combobox'
				aria-label='combo'
				aria-expanded
				aria-controls='combo-list'
				aria-activedescendant={active >= 0 ? `combo-option-${active}` : undefined}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown') setActive((index) => Math.min(index + 1, items.length - 1));
					if (event.key === 'ArrowUp') setActive((index) => Math.max(index - 1, 0));
					if (event.key === 'Enter' && active >= 0) onPick(items[active]);
				}}
			/>
			<Listbox id='combo-list'>
				{items.map((item, index) => (
					<ListboxOption key={item} id={`combo-option-${index}`} active={index === active} focusVisible onActivate={() => setActive(index)}>
						{item}
					</ListboxOption>
				))}
			</Listbox>
		</>
	);
};

export const ComboboxKeyboard: Story = {
	render: () => <Combobox />,
	play: async ({ canvasElement }) => {
		onPick.mockClear();
		const input = canvasElement.querySelector('#combo') as HTMLElement;
		const rows = [...canvasElement.querySelectorAll<HTMLElement>('[role="option"]')];
		await expectCombobox(input, rows, onPick);
		await expect(onPick).toHaveBeenCalledWith('Alpha');
		await expect(rows[0]).toHaveClass('rcx-option--focus');
		await expect(input).toHaveFocus();
	},
};

const EXPECTED_CLASSES = [
	'root > ul: rcx-box rcx-box--full rcx-listbox',
	'root > ul > li[0]: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--inset-md rcx-option',
	'root > ul > li[0] > div: rcx-item__content rcx-option__content',
	'root > ul > li[0] > div > div: rcx-item__title',
	'root > ul > li[1]: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--focus-visible rcx-item--focused rcx-item--inset-md rcx-item--selected rcx-option rcx-option--focus rcx-option--selected',
	'root > ul > li[1] > div: rcx-item__content rcx-option__content',
	'root > ul > li[1] > div > div: rcx-item__title',
	'root > ul > li[2]: rcx-item rcx-item--clickable rcx-item--disabled rcx-item--focus-managed rcx-item--inset-md rcx-option rcx-option--disabled',
	'root > ul > li[2] > div: rcx-item__content rcx-option__content',
	'root > ul > li[2] > div > div: rcx-item__title',
].join('\n');

const EXPECTED_ARIA = [
	'- listbox "Options":',
	'  - option "One" [disabled=false] [selected=false]',
	'  - option "Two" [disabled=false] [selected]',
	'  - option "Three" [disabled] [selected=false]',
].join('\n');

export const ClassAndAccessibilityContract: Story = {
	render: () => (
		<Listbox id='contract' aria-label='Options'>
			<ListboxOption id='o1'>One</ListboxOption>
			<ListboxOption id='o2' active focusVisible selected>
				Two
			</ListboxOption>
			<ListboxOption id='o3' disabled>
				Three
			</ListboxOption>
		</Listbox>
	),
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(EXPECTED_CLASSES);
		await expect(ariaSnapshot(canvasElement)).toBe(EXPECTED_ARIA);
	},
};
