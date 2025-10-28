import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtuosoMockContext } from 'react-virtuoso';

import AutoCompleteDepartmentMultiple from './AutoCompleteDepartmentMultiple';
import { createFakeDepartment } from '../../tests/mocks/data';

const mockGetDepartments = jest.fn();
const appRoot = new MockedAppRootBuilder()
	.withEndpoint('GET', '/v1/livechat/department', mockGetDepartments)
	.wrap((children) => (
		<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 28 }}>{children}</VirtuosoMockContext.Provider>
	));

it('should render autocomplete with checkbox', async () => {
	mockGetDepartments.mockResolvedValueOnce({
		departments: [createFakeDepartment({ name: 'Test Department' })],
		count: 1,
		offset: 0,
		total: 1,
	});

	render(<AutoCompleteDepartmentMultiple withCheckbox value={undefined} onChange={jest.fn()} />, { wrapper: appRoot.build() });

	await userEvent.click(screen.getByRole('listbox'));

	await waitFor(() => {
		const checkbox = within(screen.getByRole('option', { name: 'Test Department' })).getByRole('checkbox');
		expect(checkbox).toBeInTheDocument();
	});
});

it('should render autocomplete without checkbox', async () => {
	mockGetDepartments.mockResolvedValueOnce({
		departments: [createFakeDepartment({ name: 'Test Department' })],
		count: 1,
		offset: 0,
		total: 1,
	});

	render(<AutoCompleteDepartmentMultiple value={undefined} onChange={jest.fn()} />, { wrapper: appRoot.build() });

	await userEvent.click(screen.getByRole('listbox'));

	await waitFor(() => {
		const checkbox = within(screen.getByRole('option', { name: 'Test Department' })).queryByRole('checkbox');
		expect(checkbox).not.toBeInTheDocument();
	});
});
