import { composeStories } from '@storybook/react-webpack5';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import MultiSelect from './MultiSelect';
import * as stories from './MultiSelect.stories';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

withResizeObserverMock();

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

test('MultiSelectFiltered prevents Chrome autocomplete overlay (regression)', () => {
	const { WithFilter } = composeStories(stories);

	render(<WithFilter />);

	const inputElement = screen.getByRole('combobox');

	expect(inputElement).toHaveAttribute('autocomplete', 'off');
});

test('unchecks the option checkbox on deselect', async () => {
	const { Default } = composeStories(stories);

	render(<Default />);

	await userEvent.click(screen.getByRole('combobox'));

	expect(await screen.findByRole('listbox')).toBeInTheDocument();

	const option = screen.getByRole('option', { name: /a teste 1/ });
	const checkbox = within(option).getByRole('checkbox', { hidden: true });

	expect(option).toHaveAttribute('aria-selected', 'false');
	expect(checkbox).not.toBeChecked();

	await userEvent.click(option);

	expect(option).toHaveAttribute('aria-selected', 'true');
	expect(checkbox).toBeChecked();

	await userEvent.click(option);

	expect(option).toHaveAttribute('aria-selected', 'false');
	expect(checkbox).not.toBeChecked();
});

test('shows the selection of a controlled value changed after mount', () => {
	const options: [string, string][] = [
		['1', 'Apple'],
		['2', 'Banana'],
	];
	const { rerender } = render(<MultiSelect options={options} value={['1']} onChange={jest.fn()} />);
	expect(screen.getByText('Apple')).toBeInTheDocument();

	rerender(<MultiSelect options={options} value={['2']} onChange={jest.fn()} />);
	expect(screen.getByText('Banana')).toBeInTheDocument();
	expect(screen.queryByText('Apple')).not.toBeInTheDocument();
});
