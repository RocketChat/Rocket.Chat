import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import Select from './Select';
import * as stories from './Select.stories';
import type { SelectOption } from './SelectLegacy';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

const { Default, Controlled } = composeStories(stories);

withResizeObserverMock();

const units: SelectOption[] = [
	['minutes', 'Minutes'],
	['hours', 'Hours'],
	['days', 'Days'],
];

const renderUnitSelect = (props: Partial<Parameters<typeof Select>[0]> = {}) => {
	const onChange = jest.fn();

	render(
		<>
			<label htmlFor='unit'>Time unit</label>
			<Select id='unit' options={units} value='hours' onChange={onChange} {...props} />
		</>,
	);

	return { onChange, combobox: screen.getByRole('combobox', { name: 'Time unit' }) };
};

describe('[Select Component]', () => {
	it.each([
		['Default', Default],
		['Controlled', Controlled],
	])('%s should have no a11y violations', async (_name, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should be named by a label pointing at its id', () => {
		const { combobox } = renderUnitSelect();

		expect(combobox).toHaveTextContent('Hours');
		expect(combobox).toHaveAttribute('aria-expanded', 'false');
	});

	it('should be named by `aria-label`', () => {
		render(<Select aria-label='Time unit' options={units} />);

		expect(screen.getByRole('combobox', { name: 'Time unit' })).toBeInTheDocument();
	});

	it('should show the placeholder until an option is selected', () => {
		render(<Select aria-label='Time unit' options={units} placeholder='Pick a unit' />);

		expect(screen.getByRole('combobox')).toHaveTextContent('Pick a unit');
	});

	it('should open on the selected option with the keyboard, in a listbox named after the select', async () => {
		const { combobox } = renderUnitSelect();

		combobox.focus();
		await userEvent.keyboard('{ArrowDown}');

		const listbox = await screen.findByRole('listbox', { name: 'Time unit' });
		expect(combobox).toHaveAttribute('aria-expanded', 'true');
		expect(combobox).toHaveAttribute('aria-controls', listbox.id);
		expect(combobox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Hours' }).id);
		expect(screen.getByRole('option', { name: 'Hours' })).toHaveAttribute('aria-selected', 'true');
		expect(combobox).toHaveFocus();
	});

	it('should move the active option with the arrows, Home and End, and select it with Enter', async () => {
		const { combobox, onChange } = renderUnitSelect();

		combobox.focus();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		expect(combobox).toHaveAttribute('aria-activedescendant', (await screen.findByRole('option', { name: 'Days' })).id);

		await userEvent.keyboard('{Home}');
		expect(combobox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Minutes' }).id);

		await userEvent.keyboard('{End}{ArrowUp}{ArrowUp}{ArrowUp}');
		expect(combobox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Minutes' }).id);

		await userEvent.keyboard('{Enter}');
		expect(onChange).toHaveBeenCalledWith('minutes');
		expect(combobox).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(combobox).toHaveFocus();
	});

	it('should close on Escape without changing the value', async () => {
		const { combobox, onChange } = renderUnitSelect();

		combobox.focus();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}');

		expect(onChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(combobox).toHaveTextContent('Hours');
	});

	it('should select the active option on Tab', async () => {
		const { combobox, onChange } = renderUnitSelect();

		combobox.focus();
		await userEvent.keyboard('{ArrowDown}{ArrowDown}');
		await userEvent.tab();

		expect(onChange).toHaveBeenCalledWith('days');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('should open on the option that matches the typed characters', async () => {
		const { combobox } = renderUnitSelect();

		combobox.focus();
		await userEvent.keyboard('d');

		expect(combobox).toHaveAttribute('aria-activedescendant', (await screen.findByRole('option', { name: 'Days' })).id);
	});

	it('should keep a space typed within a search in the search, instead of selecting', async () => {
		const onChange = jest.fn();
		render(
			<Select
				aria-label='Test'
				options={[
					['1', 'a test 1'],
					['2', 'a test 2'],
					['3', 'another'],
				]}
				onChange={onChange}
			/>,
		);
		const combobox = screen.getByRole('combobox');

		combobox.focus();
		await userEvent.keyboard('{ArrowDown}a test 2');

		expect(onChange).not.toHaveBeenCalled();
		expect(combobox).toHaveAttribute('aria-activedescendant', (await screen.findByRole('option', { name: 'a test 2' })).id);
	});

	it('should select an option with the pointer and keep the focus on the select', async () => {
		const { combobox, onChange } = renderUnitSelect();

		await userEvent.click(combobox);
		await userEvent.click(await screen.findByRole('option', { name: 'Days' }));

		expect(onChange).toHaveBeenCalledWith('days');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(combobox).toHaveFocus();
	});

	it('should not select from the list while it closes', async () => {
		const { combobox, onChange } = renderUnitSelect();

		await userEvent.click(combobox);
		const days = await screen.findByRole('option', { name: 'Days' });
		await userEvent.keyboard('{Escape}');

		await expect(userEvent.click(days)).rejects.toThrow(/pointer-events: none/);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('should not open when disabled', async () => {
		const { combobox } = renderUnitSelect({ disabled: true });

		await userEvent.click(combobox);

		expect(combobox).toBeDisabled();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('should keep its own value when not controlled, and submit it under its name', async () => {
		const { container } = render(<Select aria-label='Time unit' options={units} defaultSelectedKey='minutes' name='unit' />);
		const combobox = screen.getByRole('combobox');

		combobox.focus();
		await userEvent.keyboard('{ArrowDown}{End}{Enter}');

		expect(combobox).toHaveTextContent('Days');
		expect(container.querySelector('input[type="hidden"][name="unit"]')).toHaveValue('days');
	});

	it('should have no a11y violations while open', async () => {
		const { combobox } = renderUnitSelect();

		await userEvent.click(combobox);
		expect(await screen.findByRole('listbox')).toBeInTheDocument();

		// The popup renders in a portal, so the scan covers the page, whose bare test markup has no landmarks.
		const results = await axe(document.body, { rules: { region: { enabled: false } } });
		expect(results).toHaveNoViolations();
	});

	it('should forward className and style to the trigger', () => {
		render(<Select aria-label='Time unit' options={units} className='custom' style={{ marginTop: 3 }} />);

		const combobox = screen.getByRole('combobox');
		expect(combobox).toHaveClass('custom', 'rcx-select');
		expect(combobox).toHaveStyle({ marginTop: '3px' });
	});
});
