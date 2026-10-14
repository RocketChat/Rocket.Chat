import { beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { fn, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

const _useDepartmentsListMock = { useDepartmentsList: fn() };

const { useDepartmentsList } = _useDepartmentsListMock as unknown as typeof import('../hooks/useDepartmentsList');

const { default: AutoCompleteDepartment } = proxyquire
	.noCallThru()
	.load<typeof import('./AutoCompleteDepartment')>('./AutoCompleteDepartment', {
		'../hooks/useDepartmentsList': _useDepartmentsListMock,
	});

const useDepartmentsListMocked = mocked(useDepartmentsList);

const appRoot = mockAppRoot().build();

describe('AutoCompleteDepartment', () => {
	beforeEach(() => {
		useDepartmentsListMocked.mockClear();
	});

	it('should render loading state correctly', () => {
		useDepartmentsListMocked.mockReturnValue({
			data: [],
			isPending: true,
			fetchNextPage: fn<FunctionLike>(),
		} as unknown as ReturnType<typeof useDepartmentsList>);

		const { rerender } = render(<AutoCompleteDepartment value='' onChange={fn<FunctionLike>()} />, { wrapper: appRoot });

		expect(screen.getByPlaceholderText('Loading...')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText('Select_an_option')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox')).toBeDisabled();

		useDepartmentsListMocked.mockReturnValue({
			data: [],
			isPending: false,
			fetchNextPage: fn<FunctionLike>(),
		} as unknown as ReturnType<typeof useDepartmentsList>);

		rerender(<AutoCompleteDepartment value='' onChange={fn<FunctionLike>()} />);

		expect(screen.getByPlaceholderText('Select_an_option')).toBeInTheDocument();
		expect(screen.queryByPlaceholderText('Loading...')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox')).toBeEnabled();
	});
});
