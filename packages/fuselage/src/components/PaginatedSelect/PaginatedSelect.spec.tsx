import { screen, render } from '@testing-library/react';

import { PaginatedSelect } from './PaginatedSelect';

describe('[PaginatedSelect Component]', () => {
	test('should render placeholder when provided', () => {
		const placeholder = 'Select an option...';
		const defaultProps = {
			filter: '',
			setFilter: jest.fn(),
			onChange: jest.fn(),
			options: [{ value: 'item1', label: `Item #1` }],
		};

		render(<PaginatedSelect {...defaultProps} placeholder={placeholder} />);

		expect(screen.getByText(placeholder)).toBeVisible();
	});
});
