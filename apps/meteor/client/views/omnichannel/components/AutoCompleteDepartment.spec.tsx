import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AutoCompleteDepartment from './AutoCompleteDepartment';
import { useDepartmentsList } from '../hooks/useDepartmentsList';

jest.mock('../hooks/useDepartmentsList');

const useDepartmentsListMocked = jest.mocked(useDepartmentsList);

const appRoot = mockAppRoot().build();

describe('AutoCompleteDepartment', () => {
	beforeEach(() => {
		useDepartmentsListMocked.mockClear();
	});

	it('should render loading state correctly', () => {
		useDepartmentsListMocked.mockReturnValue({
			data: [],
			isPending: true,
			fetchNextPage: jest.fn(),
		} as unknown as ReturnType<typeof useDepartmentsList>);

		const { rerender } = render(<AutoCompleteDepartment value='' onChange={jest.fn()} />, { wrapper: appRoot });

		expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText('Select_an_option')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox')).toBeDisabled();

		useDepartmentsListMocked.mockReturnValue({
			data: [],
			isPending: false,
			fetchNextPage: jest.fn(),
		} as unknown as ReturnType<typeof useDepartmentsList>);

		rerender(<AutoCompleteDepartment value='' onChange={jest.fn()} />);

		expect(screen.getByPlaceholderText('Select_an_option')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText('Loading...')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox')).toBeEnabled();
	});
});
