import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

import OptionContainer from './OptionContainer';
import type { OptionType } from './OptionType';
import Options from './Options';
import { useCursor } from './useCursor';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { Option } from '../Option';

// G0 characterization of Options and the legacy `useCursor` keyboard model on their develop implementation. A rewrite
// passes these unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md. The option ids are
// generated per render, so the specs read them from the DOM.
export default {
	title: 'Characterization/Options',
	component: Options,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Options<string | number, ReactNode>>;

type Story = StoryObj<typeof Options<string | number, ReactNode>>;

const options: OptionType[] = [
	[1, 'Alpha'],
	[2, 'Bravo', true],
	[3, 'Charlie', false, true],
	[4, 'Delta'],
];

const onSelect = fn();

export const Forwarding: Story = {
	render: () => (
		<Options
			options={options}
			cursor={0}
			onSelect={onSelect}
			id='list-id'
			className='consumer-class'
			title='options title'
			data-qa='options-qa'
			data-anything='anything'
			aria-label='options label'
		/>
	),
	play: async ({ canvasElement }) => {
		const root = canvasElement.querySelector('.rcx-options') as HTMLElement;
		await expectForwards(canvasElement, root, {
			'className': 'consumer-class',
			'title': 'options title',
			'data-qa': 'options-qa',
			'data-anything': 'anything',
			'aria-label': 'options label',
		});
		await expect(root).not.toHaveAttribute('id');

		const list = canvasElement.querySelector('ol') as HTMLElement;
		await expect(list).toHaveAttribute('id', 'list-id');
		await expect(list).toHaveAttribute('role', 'listbox');
		await expect(list).toHaveClass('rcx-options__list');
		await expect(list).toHaveAttribute('aria-multiselectable', 'false');
	},
};

export const SelectionAndStates: Story = {
	render: () => <Options options={options} cursor={3} onSelect={onSelect} />,
	play: async ({ canvasElement }) => {
		onSelect.mockClear();
		const rows = [...canvasElement.querySelectorAll<HTMLElement>('li.rcx-option')];
		await expect(rows).toHaveLength(4);
		for (const row of rows) {
			await expect(row).toHaveAttribute('role', 'option');
			await expect(row.id).not.toBe('');
		}
		await expect(new Set(rows.map((row) => row.id)).size).toBe(4);
		await expect(rows[1]).toHaveAttribute('aria-selected', 'true');
		await expect(rows[2]).toHaveAttribute('aria-disabled', 'true');
		await expect(rows[3]).toHaveClass('rcx-option--focus');
		await expect(rows[0]).not.toHaveClass('rcx-option--focus');
		await expect(rows[0].querySelector('.rcx-option__content')).toHaveTextContent('Alpha');

		await userEvent.pointer([{ target: rows[2], keys: '[MouseLeft]' }]);
		await expect(onSelect).not.toHaveBeenCalled();

		await userEvent.pointer([{ target: rows[0], keys: '[MouseLeft]' }]);
		await expect(onSelect).toHaveBeenCalledTimes(1);
		await expect(onSelect).toHaveBeenCalledWith([1, 'Alpha', undefined, undefined, undefined, undefined]);
	},
};

export const KeepsFocusOnPress: Story = {
	render: () => (
		<>
			<input aria-label='combobox' id='owner' />
			<Options options={options} cursor={0} onSelect={onSelect} />
		</>
	),
	play: async ({ canvasElement }) => {
		const input = canvasElement.querySelector('#owner') as HTMLElement;
		input.focus();
		await userEvent.pointer([{ target: canvasElement.querySelector('li.rcx-option') as HTMLElement, keys: '[MouseLeft]' }]);
		await expect(input).toHaveFocus();
	},
};

export const Grouped: Story = {
	render: () => (
		<Options<string | number>
			multiple
			cursor={1}
			onSelect={onSelect}
			options={[
				['h', 'Recent', null, null, 'heading'],
				[1, 'Alpha'],
				['d', null, null, null, 'divider'],
				[2, 'Bravo'],
			]}
		/>
	),
	play: async ({ canvasElement }) => {
		const list = canvasElement.querySelector('ol') as HTMLElement;
		await expect(list).toHaveAttribute('aria-multiselectable', 'true');
		const header = list.querySelector('li.rcx-option__header') as HTMLElement;
		await expect(header).toHaveAttribute('role', 'presentation');
		await expect(header).toHaveClass('rcx-item-group-header');
		const divider = list.querySelector('li.rcx-item-divider') as HTMLElement;
		await expect(divider).toHaveAttribute('aria-hidden', 'true');
		await expect(list.querySelectorAll('li[role="option"]')).toHaveLength(2);
		await expect(list.querySelectorAll('li[role="option"]')[0]).toHaveClass('rcx-option--focus');
	},
};

export const Empty: Story = {
	render: () => (
		<>
			<Options options={[]} cursor={0} onSelect={onSelect} />
			<Options options={[]} cursor={0} onSelect={onSelect} customEmpty='Nothing here' />
		</>
	),
	play: async ({ canvasElement }) => {
		const rows = [...canvasElement.querySelectorAll<HTMLElement>('li.rcx-option')];
		await expect(rows).toHaveLength(2);
		await expect(rows[0]).toHaveTextContent('Empty');
		await expect(rows[0]).toHaveAttribute('aria-disabled', 'true');
		await expect(rows[1]).toHaveTextContent('Nothing here');
	},
};

export const CustomRenderers: Story = {
	render: () => (
		<Options
			options={options}
			cursor={0}
			onSelect={onSelect}
			renderItem={({ label, value, focus, selected, disabled, ...props }) => (
				<li
					{...props}
					data-value={value}
					data-focus={String(!!focus)}
					data-selected={String(!!selected)}
					data-disabled={String(!!disabled)}
				>
					{label}
				</li>
			)}
		/>
	),
	play: async ({ canvasElement }) => {
		const rows = [...canvasElement.querySelectorAll<HTMLElement>('li[data-value]')];
		await expect(rows).toHaveLength(4);
		await expect(rows[0]).toHaveAttribute('data-focus', 'true');
		await expect(rows[1]).toHaveAttribute('data-selected', 'true');
		await expect(rows[2]).toHaveAttribute('data-disabled', 'true');
		await expect(rows[0]).toHaveAttribute('role', 'option');
		await expect(rows[0].id).not.toBe('');
	},
};

const EXPECTED_CLASSES = [
	'root > div: rcx-box rcx-box--full rcx-options',
	'root > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-2 rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
	'root > div > div > ol: rcx-box rcx-box--full rcx-options__list',
	'root > div > div > ol > li[0]: rcx-item-group-header rcx-item-group-header--inset-md rcx-option__header',
	'root > div > div > ol > li[0] > div: rcx-item-group-title',
	'root > div > div > ol > li[1]: rcx-item rcx-item--clickable rcx-item--focused rcx-item--inset-md rcx-option rcx-option--focus',
	'root > div > div > ol > li[1] > div: rcx-item__content rcx-option__content',
	'root > div > div > ol > li[1] > div > div: rcx-item__title',
	'root > div > div > ol > li[2]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-item--selected rcx-option rcx-option--selected',
	'root > div > div > ol > li[2] > div: rcx-item__content rcx-option__content',
	'root > div > div > ol > li[2] > div > div: rcx-item__title',
	'root > div > div > ol > li[3]: rcx-item-divider',
	'root > div > div > ol > li[4]: rcx-item rcx-item--clickable rcx-item--disabled rcx-item--inset-md rcx-option rcx-option--disabled',
	'root > div > div > ol > li[4] > div: rcx-item__content rcx-option__content',
	'root > div > div > ol > li[4] > div > div: rcx-item__title',
].join('\n');

const EXPECTED_ARIA = [
	'- listbox:',
	'  - text: "Heading"',
	'  - option "Alpha" [disabled=false] [selected=false]',
	'  - option "Bravo" [disabled=false] [selected]',
	'  - option "Disabled" [disabled] [selected=false]',
].join('\n');

export const ClassAndAccessibilityContract: Story = {
	render: () => (
		<Options<string | number>
			multiple
			cursor={1}
			onSelect={onSelect}
			options={[
				['h', 'Heading', null, null, 'heading'],
				[1, 'Alpha'],
				[2, 'Bravo', true],
				['d', null, null, null, 'divider'],
				[3, 'Disabled', false, true],
			]}
		/>
	),
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(EXPECTED_CLASSES);
		await expect(ariaSnapshot(canvasElement)).toBe(EXPECTED_ARIA);
	},
};

export const OptionContainerBehavior: Story = {
	render: () => (
		<OptionContainer id='container' className='consumer-class' data-qa='container-qa' role='listbox'>
			<Option label='In container' />
		</OptionContainer>
	),
	play: async ({ canvasElement }) => {
		const container = canvasElement.querySelector('#container') as HTMLElement;
		await expect(container).toHaveClass('rcx-options__list', 'rcx-options__list--container', 'consumer-class');
		await expect(container).toHaveAttribute('data-qa', 'container-qa');
		await expect(canvasElement.querySelector('.rcx-options')).toContainElement(container);
		await expect(container.querySelector('li.rcx-option')).not.toBeNull();
	},
};

const LegacyCombobox = ({ onPick }: { onPick: (option: OptionType) => void }) => {
	const [picked, setPicked] = useState<string>();
	const [cursor, handleKeyDown, handleKeyUp, reset] = useCursor(0, options, ([, label], [, hide]) => {
		hide();
		setPicked(String(label));
		onPick(options[cursor]);
	});
	return (
		<>
			<input aria-label='legacy combobox' id='legacy-input' onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onBlur={reset} />
			<output id='picked'>{picked}</output>
			<Options options={options} cursor={cursor} onSelect={onSelect} />
		</>
	);
};

const onPick = fn();

export const LegacyKeyboard: Story = {
	render: () => <LegacyCombobox onPick={onPick} />,
	play: async ({ canvasElement }) => {
		onPick.mockClear();
		const input = canvasElement.querySelector('#legacy-input') as HTMLElement;
		const focused = () => canvasElement.querySelector('li.rcx-option--focus')?.textContent;
		input.focus();
		await expect(focused()).toBe('Alpha');

		// the cursor skips the disabled Charlie, as it skips headings and dividers
		// the cursor reads `keyCode`, which `userEvent.keyboard` leaves unset
		const press = async (key: string, keyCode: number) => {
			await fireEvent.keyDown(input, { key, keyCode });
		};
		await press('ArrowDown', 40);
		await waitFor(() => expect(focused()).toBe('Bravo'));
		await press('ArrowDown', 40);
		await waitFor(() => expect(focused()).toBe('Delta'));
		await press('ArrowUp', 38);
		await waitFor(() => expect(focused()).toBe('Bravo'));
		await press('End', 35);
		await waitFor(() => expect(focused()).toBe('Delta'));
		await press('ArrowDown', 40);
		await waitFor(() => expect(focused()).toBe('Alpha'));
		await press('ArrowUp', 38);
		await waitFor(() => expect(focused()).toBe('Delta'));
		await press('Home', 36);
		await waitFor(() => expect(focused()).toBe('Alpha'));
		await press('b', 66);
		await waitFor(() => expect(focused()).toBe('Bravo'));

		await press('Enter', 13);
		await expect(onPick).toHaveBeenCalledTimes(1);
		await expect(canvasElement.querySelector('#picked')).toHaveTextContent('Bravo');
		await expect(input).toHaveFocus();
	},
};
