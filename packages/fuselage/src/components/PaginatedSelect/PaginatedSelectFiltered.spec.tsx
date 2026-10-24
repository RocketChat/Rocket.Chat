import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { VirtuosoMockContext } from 'react-virtuoso';

import { render } from '../../testing';
import { Option } from '../Option';
import PaginatedSelectFiltered from './PaginatedSelectFiltered';
import * as stories from './PaginatedSelectFiltered.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[PaginatedSelectFiltered Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('should render placeholder when provided', async () => {
		const hiddenClass = 'rcx-select__wrapper--hidden';
		const placeholder = 'Select an option...';
		const defaultProps = {
			setFilter: jest.fn(),
			onChange: jest.fn(),
			options: [{ value: 'item1', label: `Item #1` }],
		};

		const { rerender } = render(<PaginatedSelectFiltered {...defaultProps} placeholder={placeholder} />);

		expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', placeholder);

		// Necessary due to styles not being properly computed in the test environment
		expect(screen.getByRole('textbox').parentElement).not.toHaveClass(hiddenClass);

		rerender(<PaginatedSelectFiltered {...defaultProps} value='item1' />);

		expect(screen.getByRole('textbox')).not.toHaveAttribute('placeholder', placeholder);

		// Necessary due to styles not being properly computed in the test environment
		expect(screen.getByRole('textbox').parentElement).toHaveClass(hiddenClass);
	});

	test('should render custom option when renderItem is provided', async () => {
		const renderItem = jest.fn(({ label, value, index, ...props }) => (
			<Option {...props}>
				Label: {label}; Value: {value}; Index: {index}
			</Option>
		));
		const defaultProps = {
			setFilter: jest.fn(),
			onChange: jest.fn(),
			options: [
				{ value: 'item1', label: 'Item 1' },
				{ value: 'item2', label: 'Item 2' },
			],
			placeholder: 'Select an option...',
			renderItem,
		};

		render(<PaginatedSelectFiltered {...defaultProps} />, {
			wrapper: ({ children }) => (
				<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 30 }}>{children}</VirtuosoMockContext.Provider>
			),
		});

		await userEvent.click(screen.getByPlaceholderText('Select an option...'));

		expect(await screen.findByRole('listbox')).toBeInTheDocument();

		expect(
			screen.getByRole('option', {
				name: 'Label: Item 1; Value: item1; Index: 0',
			}),
		).toBeInTheDocument();

		expect(renderItem.mock.calls[0][0]).toEqual(
			expect.objectContaining({
				label: 'Item 1',
				value: 'item1',
				index: 0,
			}),
		);

		expect(
			screen.getByRole('option', {
				name: 'Label: Item 2; Value: item2; Index: 1',
			}),
		).toBeInTheDocument();

		expect(renderItem.mock.calls[1][0]).toEqual(
			expect.objectContaining({
				label: 'Item 2',
				value: 'item2',
				index: 1,
			}),
		);
	});

	test('should forward the input id and accessible label to the textbox', () => {
		render(<PaginatedSelectFiltered id='unit-input' aria-label='Unit' filter='' setFilter={() => undefined} onChange={() => undefined} options={[]} />);

		const input = screen.getByRole('textbox', { name: 'Unit' });
		expect(input).toHaveAttribute('id', 'unit-input');
	});

	test('should forward aria-labelledby to the textbox', () => {
		render(
			<>
				<span id='unit-label'>Unit</span>
				<PaginatedSelectFiltered aria-labelledby='unit-label' filter='' setFilter={() => undefined} onChange={() => undefined} options={[]} />,
			</>,
		);

		const input = screen.getByRole('textbox', { name: 'Unit' });
		expect(input).toHaveAttribute('aria-labelledby', 'unit-label');
	});
});
