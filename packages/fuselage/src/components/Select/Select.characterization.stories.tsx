/* oxlint-disable react/no-multi-comp -- the stories are fixtures */
import type { Meta, StoryObj } from '@storybook/react';
import { createRef, useCallback, useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import Select from './Select';
import SelectFiltered from './SelectFiltered';
import SelectLegacy from './SelectLegacy';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { AutoComplete } from '../AutoComplete';
import { MultiSelect, MultiSelectFiltered } from '../MultiSelect';
import { PaginatedMultiSelectFiltered, PaginatedSelectFiltered } from '../PaginatedSelect';
import PaginatedMultiSelect from '../PaginatedSelect/PaginatedMultiSelect';
import { PaginatedSelect } from '../PaginatedSelect/PaginatedSelect';

// G0 characterization of the Select family on its develop implementation: Select, SelectLegacy, SelectFiltered, MultiSelect,
// MultiSelectFiltered, AutoComplete and the paginated selects. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md. The popups render in a portal, so the specs query `document.body`, and
// the option ids are generated per render, so the specs read them from the DOM.
export default {
	title: 'Characterization/Select',
	component: Select,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>;

type Story = StoryObj<typeof Select>;

const options = [
	['a', 'Alpha'],
	['b', 'Bravo'],
	['c', 'Charlie'],
] as const;
const legacyOptions = options.map(([value, label]) => [value, label] as const) as unknown as [string, string][];
const paginated = options.map(([value, label]) => ({ value, label }));

const stubResizeObserver = () => {
	window.ResizeObserver ??= class {
		observe = () => undefined;

		unobserve = () => undefined;

		disconnect = () => undefined;
	};
};

const body = () => within(document.body);
const popupOptions = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const optionNamed = (label: string) => popupOptions().find((option) => option.textContent?.includes(label)) as HTMLElement;
// The portal the options render in, which holds nothing of the page around it
const popup = () => {
	let node = document.querySelector('.rcx-options') as HTMLElement;
	while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
	return node;
};
const openPopup = async () => body().findAllByRole('option');

const selectRef = createRef<HTMLElement>();
const selectHandlers = { onFocus: fn(), onBlur: fn(), onKeyDown: fn() };
const onSelectChange = fn();
const onLegacyChange = fn();
const legacyRef = createRef<HTMLInputElement>();
const onMultiChange = fn();
const onAutoChange = fn();
const onPaginatedChange = fn();
const onPaginatedMultiChange = fn();
const onPaginatedFilter = fn();

// The legacy cursor reads `keyCode`, which a typing library does not always set
const KEY_CODES = { ArrowDown: 40, ArrowUp: 38, Enter: 13, Escape: 27 } as const;
const press = async (element: Element, key: keyof typeof KEY_CODES) => fireEvent.keyDown(element, { key, keyCode: KEY_CODES[key] });

const lines = (...rows: string[]) => rows.join('\n');

const canvasOf = (canvas: HTMLElement) => within(canvas);

export const SelectForwarding: Story = {
	render: () => (
		<Select
			ref={selectRef}
			id='select-id'
			className='consumer-class'
			title='select title'
			data-qa='select-qa'
			data-anything='anything'
			aria-label='select label'
			aria-describedby='described-by'
			name='field-name'
			tabIndex={-1}
			options={legacyOptions}
			defaultSelectedKey='b'
			{...selectHandlers}
		/>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const trigger = canvasOf(canvasElement).getByRole('combobox');
		await expectForwards(canvasElement, trigger, {
			'className': 'consumer-class',
			'id': 'select-id',
			'title': 'select title',
			'data-qa': 'select-qa',
			'data-anything': 'anything',
			'aria-label': 'select label',
			'ref': selectRef,
			'handlers': selectHandlers,
		});
		await expect(trigger.tagName).toBe('BUTTON');
		await expect(trigger).toHaveAttribute('type', 'button');
		await expect(trigger).toHaveAttribute('aria-describedby', 'described-by');
		await expect(trigger).toHaveAttribute('tabindex', '-1');
		await expect(trigger).toHaveTextContent('Bravo');
		await expect(canvasElement.querySelector('input[type="hidden"]')).toHaveAttribute('name', 'field-name');
		await expect(canvasElement.querySelector('input[type="hidden"]')).toHaveValue('b');
	},
};

export const SelectStates: Story = {
	render: () => (
		<div>
			<Select aria-label='plain' options={legacyOptions} placeholder='Pick one' />
			<Select aria-label='small' small options={legacyOptions} defaultSelectedKey='a' />
			<Select aria-label='error' error='Required' options={legacyOptions} />
			<Select aria-label='disabled' disabled options={legacyOptions} defaultSelectedKey='c' />
		</div>
	),
	play: async ({ canvasElement }) => {
		const [plain, small, error, disabled] = canvasOf(canvasElement).getAllByRole('combobox');
		await expect(plain).toHaveTextContent('Pick one');
		await expect(small).toHaveTextContent('Alpha');
		await expect(error).toHaveAttribute('aria-invalid', 'true');
		await expect(disabled).toBeDisabled();
		await expect(disabled).toHaveTextContent('Charlie');
		await expect(plain).not.toHaveAttribute('aria-invalid');
		await fireEvent.click(disabled);
		await expect(disabled).toHaveAttribute('aria-expanded', 'false');
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div > button[0]: rcx-box rcx-box--animated rcx-box--full rcx-select rcx-select--trigger',
				'root > div > button[0] > span: rcx-box rcx-box--full rcx-select__value rcx-select__value--placeholder',
				'root > div > button[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > button[1]: rcx-box rcx-box--animated rcx-box--full rcx-select rcx-select--small rcx-select--trigger',
				'root > div > button[1] > span: rcx-box rcx-box--full rcx-select__value rcx-select__value--small',
				'root > div > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > button[2]: rcx-box rcx-box--animated rcx-box--full rcx-select rcx-select--invalid rcx-select--trigger',
				'root > div > button[2] > span: rcx-box rcx-box--full rcx-select__value rcx-select__value--placeholder',
				'root > div > button[2] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > button[3]: rcx-box rcx-box--animated rcx-box--full rcx-select rcx-select--disabled rcx-select--trigger',
				'root > div > button[3] > span: rcx-box rcx-box--full rcx-select__value',
				'root > div > button[3] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			),
		);
		await expect(ariaSnapshot(canvasElement)).toBe(
			lines(
				'- combobox "plain" [expanded=false] [haspopup=listbox]:',
				'  - text: "Pick one"',
				'- combobox "small" [expanded=false] [haspopup=listbox]:',
				'  - text: "Alpha"',
				'- combobox "error" [expanded=false] [haspopup=listbox] [invalid]',
				'- combobox "disabled" [disabled] [expanded=false] [haspopup=listbox]:',
				'  - text: "Charlie"',
			),
		);
	},
};

export const DisabledIsNotOperable: Story = {
	render: () => (
		<div>
			<Select aria-label='disabled select' disabled options={legacyOptions} defaultSelectedKey='c' />
			<SelectLegacy options={legacyOptions} disabled value='c' onChange={onLegacyChange} />
			<input aria-label='after' />
		</div>
	),
	play: async ({ canvasElement }) => {
		onLegacyChange.mockClear();
		const trigger = canvasOf(canvasElement).getByRole('combobox', { name: 'disabled select' });
		const anchor = canvasElement.querySelector('.rcx-select__focus') as HTMLElement;
		await expect(trigger).toBeDisabled();
		await expect(anchor).toBeDisabled();
		await userEvent.tab();
		await expect(canvasOf(canvasElement).getByRole('textbox', { name: 'after' })).toHaveFocus();
		await expect(onLegacyChange).not.toHaveBeenCalled();
	},
};

export const SelectKeyboard: Story = {
	render: () => {
		const Controlled = () => {
			const [value, setValue] = useState('b');
			return (
				<div>
					<label htmlFor='unit'>Unit</label>
					<Select
						id='unit'
						options={legacyOptions}
						value={value}
						onChange={(key) => {
							setValue(key);
							onSelectChange(key);
						}}
					/>
				</div>
			);
		};
		return <Controlled />;
	},
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onSelectChange.mockClear();
		const trigger = canvasOf(canvasElement).getByRole('combobox', { name: 'Unit' });
		const user = userEvent.setup();
		trigger.focus();
		await user.keyboard('{ArrowDown}');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		const [alpha, bravo, charlie] = await openPopup();
		await expect(trigger).toHaveFocus();
		await expect(trigger).toHaveAttribute('aria-activedescendant', bravo.id);
		await expect(bravo).toHaveAttribute('aria-selected', 'true');
		await user.keyboard('{ArrowDown}');
		await expect(trigger).toHaveAttribute('aria-activedescendant', charlie.id);
		await user.keyboard('{Home}');
		await expect(trigger).toHaveAttribute('aria-activedescendant', alpha.id);
		await user.keyboard('{Enter}');
		await expect(onSelectChange).toHaveBeenCalledWith('a');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
		await expect(trigger).toHaveTextContent('Alpha');

		await user.keyboard('{ArrowDown}');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		await user.keyboard('{Escape}');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));

		await user.keyboard('c');
		await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
		await expect(trigger).toHaveAttribute('aria-activedescendant', optionNamed('Charlie').id);
		await user.keyboard('{Tab}');
		await expect(onSelectChange).toHaveBeenLastCalledWith('c');
	},
};

export const SelectOpen: Story = {
	render: () => <Select aria-label='Letters' options={legacyOptions} defaultSelectedKey='a' />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const trigger = canvasOf(canvasElement).getByRole('combobox');
		await userEvent.click(trigger);
		await openPopup();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect(classContract(popup())).toBe(
			lines(
				'root > div: rcx-box rcx-box--full',
				'root > div > div: rcx-box rcx-box--full rcx-options',
				'root > div > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-1 rcx-tile rcx-tile--elevation-1 rcx-tile--flush',
				'root > div > div > div > div: rcx-box rcx-box--full rcx-options__list rcx-options__list--container',
				'root > div > div > div > div > ul: rcx-box rcx-box--full rcx-listbox',
				'root > div > div > div > div > ul > li[0]: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--focused rcx-item--inset-md rcx-item--selected rcx-option rcx-option--focus rcx-option--selected',
				'root > div > div > div > div > ul > li[0] > div: rcx-item__content rcx-option__content',
				'root > div > div > div > div > ul > li[0] > div > div: rcx-item__title',
				'root > div > div > div > div > ul > li[1]: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--inset-md rcx-option',
				'root > div > div > div > div > ul > li[1] > div: rcx-item__content rcx-option__content',
				'root > div > div > div > div > ul > li[1] > div > div: rcx-item__title',
				'root > div > div > div > div > ul > li[2]: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--inset-md rcx-option',
				'root > div > div > div > div > ul > li[2] > div: rcx-item__content rcx-option__content',
				'root > div > div > div > div > ul > li[2] > div > div: rcx-item__title',
			),
		);
		await expect(ariaSnapshot(popup())).toBe(
			lines(
				'- listbox "Letters":',
				'  - option "Alpha" [disabled=false] [selected]',
				'  - option "Bravo" [disabled=false] [selected=false]',
				'  - option "Charlie" [disabled=false] [selected=false]',
			),
		);
		await userEvent.click(optionNamed('Charlie'));
		await waitFor(() => expect(trigger).toHaveTextContent('Charlie'));
	},
};

export const SelectLegacyForwarding: Story = {
	render: () => (
		<SelectLegacy
			ref={legacyRef}
			id='legacy-id'
			className='consumer-class'
			title='legacy title'
			data-qa='legacy-qa'
			data-anything='anything'
			aria-label='legacy label'
			aria-describedby='described-by'
			aria-invalid='true'
			options={legacyOptions}
			value='b'
			onChange={onLegacyChange}
		/>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const container = canvasElement.querySelector('.rcx-select') as HTMLElement;
		await expectForwards(canvasElement, container, {
			'className': 'consumer-class',
			'title': 'legacy title',
			'data-qa': 'legacy-qa',
			'data-anything': 'anything',
			'aria-label': 'legacy label',
		});
		await expect(container).not.toHaveAttribute('id');
		const anchor = canvasElement.querySelector('.rcx-select__focus') as HTMLElement;
		await expectForwards(canvasElement, anchor, { id: 'legacy-id', ref: legacyRef });
		await expect(anchor).toHaveAttribute('aria-describedby', 'described-by');
		await expect(anchor).toHaveAttribute('aria-invalid', 'true');
		await expect(anchor.tagName).toBe('BUTTON');
		await expect(canvasElement.querySelector('.rcx-select__item')).toHaveTextContent('Bravo');
	},
};

export const SelectLegacyKeyboard: Story = {
	render: () => <SelectLegacy options={legacyOptions} value='b' onChange={onLegacyChange} />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onLegacyChange.mockClear();
		const anchor = canvasElement.querySelector('.rcx-select__focus') as HTMLElement;
		anchor.focus();
		await press(anchor, 'ArrowDown');
		await openPopup();
		await waitFor(() => expect(optionNamed('Charlie')).toHaveClass('rcx-option--focus'));
		await press(anchor, 'Enter');
		await expect(onLegacyChange).toHaveBeenCalledWith('c');
		await waitFor(() => expect(canvasElement.querySelector('.rcx-select__item')).toHaveTextContent('Charlie'));
	},
};

export const SelectLegacyClasses: Story = {
	render: () => (
		<div>
			<SelectLegacy options={legacyOptions} value='b' onChange={onLegacyChange} />
			<SelectLegacy options={legacyOptions} placeholder='Pick one' onChange={onLegacyChange} />
			<SelectLegacy options={legacyOptions} error='Required' value='a' onChange={onLegacyChange} />
			<SelectLegacy options={legacyOptions} disabled value='c' onChange={onLegacyChange} />
		</div>
	),
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div > div[0]: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-select__wrapper rcx-select__wrapper--hidden',
				'root > div > div[0] > div > span: rcx-box rcx-box--full rcx-select__item',
				'root > div > div[0] > div > button: rcx-box rcx-box--full rcx-select__focus rcx-select__focus--button',
				'root > div > div[0] > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[0] > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > div[1]: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div[1] > div: rcx-box rcx-box--full rcx-select__wrapper rcx-select__wrapper--hidden',
				'root > div > div[1] > div > span: rcx-box rcx-box--full rcx-select__item rcx-select__item--placeholder',
				'root > div > div[1] > div > button: rcx-box rcx-box--full rcx-select__focus rcx-select__focus--button',
				'root > div > div[1] > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[1] > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > div[2]: rcx-box rcx-box--animated rcx-box--full rcx-select rcx-select--invalid',
				'root > div > div[2] > div: rcx-box rcx-box--full rcx-select__wrapper rcx-select__wrapper--hidden',
				'root > div > div[2] > div > span: rcx-box rcx-box--full rcx-select__item',
				'root > div > div[2] > div > button: rcx-box rcx-box--full rcx-select__focus rcx-select__focus--button',
				'root > div > div[2] > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[2] > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > div[3]: rcx-box rcx-box--animated rcx-box--full rcx-select rcx-select--disabled',
				'root > div > div[3] > div: rcx-box rcx-box--full rcx-select__wrapper rcx-select__wrapper--hidden',
				'root > div > div[3] > div > span: rcx-box rcx-box--full rcx-select__item',
				'root > div > div[3] > div > button: rcx-box rcx-box--full rcx-select__focus rcx-select__focus--button',
				'root > div > div[3] > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[3] > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			),
		);
		await expect(ariaSnapshot(canvasElement)).toBe(
			lines(
				'- text: "Bravo"',
				'- button',
				'- text: "Pick one"',
				'- button "Pick one"',
				'- text: "Alpha"',
				'- button',
				'- text: "Charlie"',
				'- button [disabled]',
			),
		);
	},
};

export const SelectLegacyOpen: Story = {
	render: () => <SelectLegacy options={legacyOptions} value='b' onChange={onLegacyChange} />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await userEvent.click(canvasElement.querySelector('.rcx-select') as HTMLElement);
		await openPopup();
		await expect(classContract(popup())).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-options',
				'root > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-2 rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
				'root > div > div > ol: rcx-box rcx-box--full rcx-options__list',
				'root > div > div > ol > li[0]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
				'root > div > div > ol > li[0] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[0] > div > div: rcx-item__title',
				'root > div > div > ol > li[1]: rcx-item rcx-item--clickable rcx-item--focused rcx-item--inset-md rcx-item--selected rcx-option rcx-option--focus rcx-option--selected',
				'root > div > div > ol > li[1] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[1] > div > div: rcx-item__title',
				'root > div > div > ol > li[2]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
				'root > div > div > ol > li[2] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[2] > div > div: rcx-item__title',
			),
		);
		await expect(ariaSnapshot(popup())).toBe(
			lines(
				'- listbox:',
				'  - listbox:',
				'    - option "Alpha" [disabled=false] [selected=false]',
				'    - option "Bravo" [disabled=false] [selected]',
				'    - option "Charlie" [disabled=false] [selected=false]',
			),
		);
		await userEvent.click(optionNamed('Charlie'));
		await expect(onLegacyChange).toHaveBeenLastCalledWith('c');
	},
};

export const SelectFilteredFilter: Story = {
	render: () => <SelectFiltered options={legacyOptions} placeholder='Search' onChange={onLegacyChange} />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onLegacyChange.mockClear();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input).toHaveAttribute('placeholder', 'Search');
		await expect(input).toHaveClass('rcx-select__focus', 'rcx-select__filter');
		await userEvent.click(input);
		await userEvent.type(input, 'ch');
		await waitFor(() => expect(popupOptions()).toHaveLength(1));
		await expect(popupOptions()[0]).toHaveTextContent('Charlie');
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div: rcx-box rcx-box--full rcx-select__wrapper',
				'root > div > div > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated rcx-select__filter rcx-select__focus',
				'root > div > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-up',
			),
		);
		await waitFor(() => expect(optionNamed('Charlie')).toHaveClass('rcx-option--focus'));
		await press(input, 'Enter');
		await expect(onLegacyChange).toHaveBeenCalledWith('c');
	},
};

export const MultiSelectChips: Story = {
	render: () => {
		const Controlled = () => {
			const [value, setValue] = useState(['a']);
			return (
				<MultiSelect
					className='consumer-class'
					data-qa='multi-qa'
					id='multi-id'
					aria-label='multi label'
					options={legacyOptions}
					value={value}
					placeholder='Pick'
					onChange={(next) => {
						setValue(next);
						onMultiChange(next);
					}}
				/>
			);
		};
		return <Controlled />;
	},
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onMultiChange.mockClear();
		const container = canvasElement.querySelector('.rcx-select') as HTMLElement;
		await expectForwards(canvasElement, container, { 'className': 'consumer-class', 'data-qa': 'multi-qa' });
		const anchor = canvasElement.querySelector('.rcx-select__focus') as HTMLElement;
		await expect(anchor).toHaveAttribute('id', 'multi-id');
		await expect(anchor).toHaveAttribute('role', 'combobox');
		await expect(anchor).toHaveAttribute('aria-label', 'multi label');
		await expect(canvasElement.querySelectorAll('.rcx-chip')).toHaveLength(1);
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div[0]: rcx-box rcx-box--full rcx-select__field',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-select__values',
				'root > div > div[0] > div > button[0]: rcx-box rcx-box--full rcx-select__anchor--last rcx-select__focus rcx-select__focus--button',
				'root > div > div[0] > div > button[1]: rcx-box rcx-chip',
				'root > div > div[0] > div > button[1] > span: rcx-box rcx-chip__text',
				'root > div > div[0] > div > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[1]: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			),
		);
		await userEvent.click(anchor);
		await openPopup();
		await expect(classContract(popup())).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-options',
				'root > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-2 rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
				'root > div > div > ol: rcx-box rcx-box--full rcx-options__list',
				'root > div > div > ol > li[0]: rcx-item rcx-item--clickable rcx-item--focused rcx-item--inset-md rcx-item--selected rcx-option rcx-option--focus rcx-option--selected',
				'root > div > div > ol > li[0] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[0] > div > div: rcx-item__title',
				'root > div > div > ol > li[0] > label: rcx-box rcx-box--full rcx-check-box',
				'root > div > div > ol > li[0] > label > input: rcx-box rcx-box--full rcx-check-box__input',
				'root > div > div > ol > li[0] > label > i: rcx-box rcx-box--full rcx-check-box__fake',
				'root > div > div > ol > li[1]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
				'root > div > div > ol > li[1] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[1] > div > div: rcx-item__title',
				'root > div > div > ol > li[1] > label: rcx-box rcx-box--full rcx-check-box',
				'root > div > div > ol > li[1] > label > input: rcx-box rcx-box--full rcx-check-box__input',
				'root > div > div > ol > li[1] > label > i: rcx-box rcx-box--full rcx-check-box__fake',
				'root > div > div > ol > li[2]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
				'root > div > div > ol > li[2] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[2] > div > div: rcx-item__title',
				'root > div > div > ol > li[2] > label: rcx-box rcx-box--full rcx-check-box',
				'root > div > div > ol > li[2] > label > input: rcx-box rcx-box--full rcx-check-box__input',
				'root > div > div > ol > li[2] > label > i: rcx-box rcx-box--full rcx-check-box__fake',
			),
		);
		await userEvent.click(optionNamed('Charlie'));
		await expect(onMultiChange).toHaveBeenLastCalledWith(['a', 'c']);
		await waitFor(() => expect(canvasElement.querySelectorAll('.rcx-chip')).toHaveLength(2));
		await userEvent.click(canvasElement.querySelector('.rcx-chip') as HTMLElement);
		await expect(onMultiChange).toHaveBeenLastCalledWith(['c']);
	},
};

export const MultiSelectFilteredFilter: Story = {
	render: () => <MultiSelectFiltered options={legacyOptions} value={['a']} placeholder='Search' onChange={onMultiChange} />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onMultiChange.mockClear();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input).toHaveClass('rcx-select__anchor--grow', 'rcx-select__anchor--last');
		await expect(input).toHaveAttribute('autocomplete', 'off');
		await userEvent.click(input);
		await userEvent.type(input, 'br');
		await waitFor(() => expect(popupOptions()).toHaveLength(1));
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div[0]: rcx-box rcx-box--full rcx-select__field',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-select__values',
				'root > div > div[0] > div > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated rcx-select__anchor--grow rcx-select__anchor--last',
				'root > div > div[0] > div > button: rcx-box rcx-chip',
				'root > div > div[0] > div > button > span: rcx-box rcx-chip__text',
				'root > div > div[0] > div > button > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[1]: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-up',
			),
		);
		await userEvent.click(popupOptions()[0]);
		await expect(onMultiChange).toHaveBeenLastCalledWith(['a', 'b']);
	},
};

export const AutoCompleteSelection: Story = {
	render: () => {
		const Controlled = () => {
			const [filter, setFilter] = useState('');
			const [value, setValue] = useState<string | string[]>('a');
			return (
				<AutoComplete
					filter={filter}
					setFilter={setFilter}
					value={value}
					options={paginated}
					placeholder='Search'
					className='consumer-class'
					data-qa='auto-qa'
					onChange={(next) => {
						setValue(next);
						onAutoChange(next);
					}}
				/>
			);
		};
		return <Controlled />;
	},
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onAutoChange.mockClear();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expectForwards(canvasElement, input, { 'className': 'consumer-class', 'data-qa': 'auto-qa' });
		await expect(input).toHaveClass('rcx-autocomplete__input');
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-autocomplete rcx-box rcx-box--animated rcx-box--full',
				'root > div > div[0]: rcx-autocomplete__group rcx-box rcx-box--full',
				'root > div > div[0] > input: rcx-autocomplete__input rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated',
				'root > div > div[0] > button: rcx-box rcx-chip',
				'root > div > div[0] > button > span: rcx-box rcx-chip__text',
				'root > div > div[0] > button > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[1]: rcx-autocomplete__addon rcx-box rcx-box--full',
				'root > div > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-magnifier',
			),
		);
		await userEvent.click(input);
		await openPopup();
		await expect(classContract(popup())).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-options',
				'root > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-2 rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
				'root > div > div > ol: rcx-box rcx-box--full rcx-options__list',
				'root > div > div > ol > li[0]: rcx-item rcx-item--clickable rcx-item--focused rcx-item--inset-md rcx-option rcx-option--focus',
				'root > div > div > ol > li[0] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[0] > div > div: rcx-item__title',
				'root > div > div > ol > li[1]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
				'root > div > div > ol > li[1] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[1] > div > div: rcx-item__title',
				'root > div > div > ol > li[2]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
				'root > div > div > ol > li[2] > div: rcx-item__content rcx-option__content',
				'root > div > div > ol > li[2] > div > div: rcx-item__title',
			),
		);
		await userEvent.click(optionNamed('Charlie'));
		await expect(onAutoChange).toHaveBeenLastCalledWith('c');
		await userEvent.click(canvasElement.querySelector('.rcx-chip') as HTMLElement);
		await expect(onAutoChange).toHaveBeenLastCalledWith('');
	},
};

export const AutoCompleteStates: Story = {
	render: () => (
		<div>
			<AutoComplete filter='' options={paginated} error disabled onChange={onAutoChange} />
			<AutoComplete filter='' options={paginated} multiple value={['a', 'b']} onChange={onAutoChange} />
		</div>
	),
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div > div[0]: rcx-autocomplete rcx-autocomplete--disabled rcx-autocomplete--invalid rcx-box rcx-box--animated rcx-box--full',
				'root > div > div[0] > div[0]: rcx-autocomplete__group rcx-box rcx-box--full',
				'root > div > div[0] > div[0] > input: rcx-autocomplete__input rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated',
				'root > div > div[0] > div[1]: rcx-autocomplete__addon rcx-box rcx-box--full',
				'root > div > div[0] > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-magnifier',
				'root > div > div[1]: rcx-autocomplete rcx-box rcx-box--animated rcx-box--full',
				'root > div > div[1] > div[0]: rcx-autocomplete__group rcx-box rcx-box--full',
				'root > div > div[1] > div[0] > input: rcx-autocomplete__input rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated',
				'root > div > div[1] > div[0] > button[0]: rcx-box rcx-chip',
				'root > div > div[1] > div[0] > button[0] > span: rcx-box rcx-chip__text',
				'root > div > div[1] > div[0] > button[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[1] > div[0] > button[1]: rcx-box rcx-chip',
				'root > div > div[1] > div[0] > button[1] > span: rcx-box rcx-chip__text',
				'root > div > div[1] > div[0] > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[1] > div[1]: rcx-autocomplete__addon rcx-box rcx-box--full',
				'root > div > div[1] > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-magnifier',
			),
		);
		await expect(ariaSnapshot(canvasElement)).toBe(
			lines('- group:', '  - textbox [disabled]', '- group:', '  - textbox', '  - button "Alpha"', '  - button "Bravo"'),
		);
	},
};

export const PaginatedSelectOpen: Story = {
	render: () => (
		<PaginatedSelect className='consumer-class' data-qa='paginated-qa' options={paginated} value='b' onChange={onPaginatedChange} />
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onPaginatedChange.mockClear();
		const container = canvasElement.querySelector('.rcx-select') as HTMLElement;
		await expectForwards(canvasElement, container, { 'className': 'consumer-class', 'data-qa': 'paginated-qa' });
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div: rcx-box rcx-box--full rcx-select__wrapper rcx-select__wrapper--hidden',
				'root > div > div > span: rcx-box rcx-box--full rcx-select__item rcx-select__item--medium',
				'root > div > div > button: rcx-box rcx-box--full rcx-select__focus rcx-select__focus--button',
				'root > div > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			),
		);
		await userEvent.click(container);
		await waitFor(() => expect(document.querySelector('.rcx-options')).not.toBeNull());
		await expect(classContract(popup())).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-options',
				'root > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-2 rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
			),
		);
	},
};

export const PaginatedSelectFilteredFilter: Story = {
	render: () => {
		const Controlled = () => {
			const [filter, setFilter] = useState('');
			const update = useCallback((next: string | number | undefined) => setFilter(String(next ?? '')), []);
			return (
				<PaginatedSelectFiltered options={paginated} filter={filter} setFilter={update} placeholder='Search' onChange={onPaginatedChange} />
			);
		};
		return <Controlled />;
	},
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input).toHaveClass('rcx-select__focus', 'rcx-select__filter');
		await userEvent.click(input);
		await userEvent.type(input, 'ch');
		await expect(input).toHaveValue('ch');
		await waitFor(() => expect(document.querySelector('.rcx-options')).not.toBeNull());
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--animated rcx-box--full rcx-select',
				'root > div > div: rcx-box rcx-box--full rcx-select__wrapper',
				'root > div > div > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated rcx-select__filter rcx-select__focus',
				'root > div > div > div: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-up',
			),
		);
	},
};

export const PaginatedMultiSelectChips: Story = {
	render: () => (
		<PaginatedMultiSelect
			className='consumer-class'
			data-qa='paginated-multi-qa'
			options={paginated}
			value={[paginated[0]]}
			placeholder='Pick'
			onChange={onPaginatedMultiChange}
		/>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onPaginatedMultiChange.mockClear();
		const container = canvasElement.querySelector('.rcx-select') as HTMLElement;
		await expectForwards(canvasElement, container, { 'className': 'consumer-class', 'data-qa': 'paginated-multi-qa' });
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-select',
				'root > div > div[0]: rcx-box rcx-box--full rcx-select__field',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-select__values rcx-select__values--spacious',
				'root > div > div[0] > div > button[0]: rcx-box rcx-box--full rcx-select__anchor--last rcx-select__focus rcx-select__focus--button',
				'root > div > div[0] > div > button[1]: rcx-box rcx-chip rcx-select__chip',
				'root > div > div[0] > div > button[1] > span: rcx-box rcx-chip__text',
				'root > div > div[0] > div > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[1]: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			),
		);
		await userEvent.click(container);
		await waitFor(() => expect(document.querySelector('.rcx-options')).not.toBeNull());
		await expect(classContract(popup())).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-options',
				'root > div > div: rcx-box rcx-box--full rcx-popover-surface rcx-popover-surface--elevation-2 rcx-tile rcx-tile--elevation-2 rcx-tile--flush',
			),
		);
		await userEvent.click(canvasElement.querySelector('.rcx-chip') as HTMLElement);
		await expect(onPaginatedMultiChange).toHaveBeenLastCalledWith([]);
	},
};

export const PaginatedMultiSelectFilteredFilter: Story = {
	render: () => (
		<PaginatedMultiSelectFiltered
			options={paginated}
			filter=''
			setFilter={onPaginatedFilter}
			placeholder='Search'
			onChange={onPaginatedMultiChange}
		/>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const input = canvasElement.querySelector('input') as HTMLInputElement;
		await expect(input).toHaveClass('rcx-select__anchor--grow');
		await userEvent.click(input);
		await userEvent.type(input, 'a');
		await expect(onPaginatedFilter).toHaveBeenCalled();
		await waitFor(() => expect(document.querySelector('.rcx-options')).not.toBeNull());
		await expect(classContract(canvasElement)).toBe(
			lines(
				'root > div: rcx-box rcx-box--full rcx-select',
				'root > div > div[0]: rcx-box rcx-box--full rcx-select__field',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-select__values rcx-select__values--spacious',
				'root > div > div[0] > div > input: rcx-box rcx-box--animated rcx-box--full rcx-input-box rcx-input-box--undecorated rcx-select__anchor--grow rcx-select__anchor--last',
				'root > div > div[1]: rcx-box rcx-box--full rcx-select__addon',
				'root > div > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
			),
		);
	},
};
