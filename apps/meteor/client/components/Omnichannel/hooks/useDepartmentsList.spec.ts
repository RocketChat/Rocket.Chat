import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useDepartmentsList } from './useDepartmentsList';

const initialDepartmentsListMock = Array.from(Array(25)).map((_, index) => {
	return {
		_id: `${index}`,
		name: `test_department_${index}`,
		enabled: true,
		email: `test${index}@email.com`,
		showOnRegistration: false,
		showOnOfflineForm: false,
		type: 'd',
		_updatedAt: '2024-09-26T20:05:31.330Z',
		offlineMessageChannelName: '',
		numAgents: 0,
		ancestors: undefined,
		parentId: undefined,
	};
});

it('should not fetch and add selected department if it is already in the departments list on first fetch', async () => {
	const selectedDepartmentMappedToOption = {
		_id: '5',
		label: 'test_department_5',
		value: '5',
	};

	const getDepartmentByIdCallback = jest.fn();

	const { result } = renderHook(
		() =>
			useDepartmentsList({
				filter: '',
				onlyMyDepartments: true,
				haveAll: true,
				showArchived: true,
				selectedDepartment: '5',
			}),
		{
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/livechat/department', () => ({
					count: 25,
					offset: 0,
					total: 25,
					departments: initialDepartmentsListMock,
				}))
				.withEndpoint('GET', `/v1/livechat/department/:_id`, getDepartmentByIdCallback)
				.build(),
		},
	);

	expect(getDepartmentByIdCallback).not.toHaveBeenCalled();
	await waitFor(() => expect(result.current.itemsList.items).toContainEqual(selectedDepartmentMappedToOption));
	// The expected length is 26 because the hook will add the 'All' item on run time
	await waitFor(() => expect(result.current.itemsList.items.length).toBe(26));
});

it('should fetch and add selected department if it is not part of departments list on first fetch', async () => {
	const missingDepartmentRawMock = {
		_id: '56f5be8bcf8cd67f9e9bcfdc',
		name: 'test_department_25',
		enabled: true,
		email: 'test25@email.com',
		showOnRegistration: false,
		showOnOfflineForm: false,
		type: 'd',
		_updatedAt: '2024-09-26T20:05:31.330Z',
		offlineMessageChannelName: '',
		numAgents: 0,
		ancestors: undefined,
		parentId: undefined,
	};

	const missingDepartmentMappedToOption = {
		_id: '56f5be8bcf8cd67f9e9bcfdc',
		label: 'test_department_25',
		value: '56f5be8bcf8cd67f9e9bcfdc',
	};

	const { result } = renderHook(
		() =>
			useDepartmentsList({
				filter: '',
				onlyMyDepartments: true,
				haveAll: true,
				showArchived: true,
				selectedDepartment: '56f5be8bcf8cd67f9e9bcfdc',
			}),
		{
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/livechat/department', () => ({
					count: 25,
					offset: 0,
					total: 25,
					departments: initialDepartmentsListMock,
				}))
				.withEndpoint('GET', `/v1/livechat/department/:_id`, () => ({
					department: missingDepartmentRawMock,
				}))
				.build(),
		},
	);

	await waitFor(() => expect(result.current.itemsList.items).toContainEqual(missingDepartmentMappedToOption));
	// The expected length is 27 because the hook will add the 'All' item and the missing department on run time
	await waitFor(() => expect(result.current.itemsList.items.length).toBe(27));
});
