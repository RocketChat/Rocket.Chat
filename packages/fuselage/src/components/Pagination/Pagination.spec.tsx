import { composeStories } from '@storybook/react-webpack5';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Pagination from './Pagination';
import * as stories from './Pagination.stories';

const { Default } = composeStories(stories);

jest.mock('react', () => ({
	...jest.requireActual('react'),
	useId: () => 'test-id',
}));

describe('[Pagination Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should override with custom aria-label', () => {
		render(<Default aria-label='Custom Pagination Navigation' />);

		expect(screen.getByLabelText('Custom Pagination Navigation')).toBeInTheDocument();
	});

	describe('empty state (count = 0)', () => {
		it('disables both Next and Previous buttons when count is 0', () => {
			render(<Pagination count={0} />);

			expect(screen.getByLabelText('Previous page')).toBeDisabled();
			expect(screen.getByLabelText('Next page')).toBeDisabled();
		});

		it('does not call onSetCurrent when clicking Next with zero results', () => {
			const handleSetCurrent = jest.fn();
			render(<Pagination count={0} onSetCurrent={handleSetCurrent} />);

			fireEvent.click(screen.getByLabelText('Next page'));
			expect(handleSetCurrent).not.toHaveBeenCalled();
		});

		it('displays "Showing results 0 - 0 of 0" when count is 0', () => {
			render(<Pagination count={0} />);

			expect(screen.getByText('Showing results 0 - 0 of 0')).toBeInTheDocument();
		});
	});

	describe('normal pagination functionality', () => {
		it('disables both Next and Previous buttons for a single page (count <= itemsPerPage)', () => {
			render(<Pagination count={10} itemsPerPage={25} />);

			expect(screen.getByLabelText('Previous page')).toBeDisabled();
			expect(screen.getByLabelText('Next page')).toBeDisabled();
			expect(screen.getByText('Showing results 1 - 10 of 10')).toBeInTheDocument();
		});

		it('handles multiple pages: enables Next on first page and advances on click', () => {
			const handleSetCurrent = jest.fn();
			render(<Pagination count={60} current={0} itemsPerPage={25} onSetCurrent={handleSetCurrent} />);

			expect(screen.getByLabelText('Previous page')).toBeDisabled();
			expect(screen.getByLabelText('Next page')).not.toBeDisabled();
			expect(screen.getByText('Showing results 1 - 25 of 60')).toBeInTheDocument();

			fireEvent.click(screen.getByLabelText('Next page'));
			expect(handleSetCurrent).toHaveBeenCalledTimes(1);
			expect(handleSetCurrent).toHaveBeenCalledWith(25);
		});

		it('disables Next button when on the last page', () => {
			render(<Pagination count={60} current={50} itemsPerPage={25} />);

			expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
			expect(screen.getByLabelText('Next page')).toBeDisabled();
			expect(screen.getByText('Showing results 51 - 60 of 60')).toBeInTheDocument();
		});

		it('disables Next button when currentPage exceeds pages - 1', () => {
			render(<Pagination count={20} current={50} itemsPerPage={25} />);

			expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
			expect(screen.getByLabelText('Next page')).toBeDisabled();
		});
	});
});
