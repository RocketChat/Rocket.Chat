import { composeStories } from '@storybook/react';
import { fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';

import Pagination from './Pagination';
import * as stories from './Pagination.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

jest.mock('react', () => ({
	...jest.requireActual('react'),
	useId: () => 'test-id',
}));

it('%s should have no a11y violations', async () => {
	const { container } = render(<Default />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should override with custom aria-label', () => {
	const { getByLabelText } = render(<Default aria-label='Custom Pagination Navigation' />);

	expect(getByLabelText('Custom Pagination Navigation')).toBeInTheDocument();
});

it('reports the page and the page size its buttons pick', () => {
	const onSetCurrent = jest.fn();
	const onSetItemsPerPage = jest.fn();
	const { getByLabelText } = render(
		<Pagination count={100} current={25} itemsPerPage={25} onSetCurrent={onSetCurrent} onSetItemsPerPage={onSetItemsPerPage} />,
	);

	fireEvent.click(getByLabelText('Page 3'));
	fireEvent.click(getByLabelText('Previous page'));
	fireEvent.click(getByLabelText('Next page'));
	fireEvent.click(getByLabelText('Show 50 items per page'));

	expect(onSetCurrent.mock.calls).toEqual([[50], [0], [50]]);
	expect(onSetItemsPerPage).toHaveBeenCalledWith(50);
	expect(getByLabelText('Page 2')).toBeDisabled();
});
