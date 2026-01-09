import type { ILivechatDepartment, Serialized } from '@rocket.chat/core-typings';
import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useDepartmentsList } from './useDepartmentsList';
import { createFakeDepartment } from '../../../../tests/mocks/data';

const formatDepartmentItem = (department: Serialized<ILivechatDepartment>) => ({
	_id: department._id,
	label: department.archived ? `${department.name} [Archived]` : department.name,
	value: department._id,
});

const mockGetDepartments = jest.fn();
const mockGetUnitDepartments = jest.fn();
const mockGetDepartment = jest.fn();

const appRoot = new MockedAppRootBuilder()
	.withTranslations('en', 'core', { All: 'All', None: 'None', Archived: 'Archived' })
	.withEndpoint('GET', '/v1/livechat/department', mockGetDepartments)
	.withEndpoint('GET', '/v1/livechat/units/:unitId/departments/available', mockGetUnitDepartments)
	.withEndpoint('GET', '/v1/livechat/department/:_id', mockGetDepartment);

afterEach(() => {
	jest.clearAllMocks();
});

it('should fetch departments', async () => {
	const limit = 5;

	const data = Array.from({ length: 10 }, () => createFakeDepartment());

	mockGetDepartments.mockImplementation(({ offset, count }: { offset: number; count: number }) => {
		const departments = data.slice(offset, offset + count);

		return {
			departments,
			count,
			offset,
			total: data.length,
		};
	});

	const { result } = renderHook(() => useDepartmentsList({ filter: '', limit }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(data.slice(0, 5).map(formatDepartmentItem)));

	await act(() => result.current.fetchNextPage());

	await waitFor(() => expect(result.current.data).toEqual(data.map(formatDepartmentItem)));

	await act(() => result.current.fetchNextPage());

	// should not fetch again since total was reached
	expect(mockGetDepartments).toHaveBeenCalledTimes(2);
});

it('should fetch unit departments when unitId is provided', async () => {
	const unitDepartmentsList = Array.from({ length: 10 }, () => createFakeDepartment());
	const departmentItems = unitDepartmentsList.map(formatDepartmentItem);
	mockGetUnitDepartments.mockResolvedValue({
		departments: unitDepartmentsList,
		count: 5,
		offset: 0,
		total: 5,
	});

	const { result } = renderHook(() => useDepartmentsList({ filter: '', unitId: '123' }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data).toEqual(departmentItems));

	expect(mockGetDepartment).not.toHaveBeenCalled();
	expect(mockGetDepartments).not.toHaveBeenCalled();
	expect(mockGetUnitDepartments).toHaveBeenCalled();
});

it('should format archived departments correctly', async () => {
	mockGetDepartments.mockResolvedValueOnce({
		departments: [createFakeDepartment({ name: 'Test Department', archived: true })],
		count: 1,
		offset: 0,
		total: 1,
	});

	const { result } = renderHook(() => useDepartmentsList({ filter: '' }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data.length).toBe(1));
	expect(result.current.data[0].label).toBe('Test Department [Archived]');
});

it('should include "All" item if haveAll is true', async () => {
	mockGetDepartments.mockResolvedValueOnce({
		departments: Array.from({ length: 5 }, () => createFakeDepartment()),
		count: 5,
		offset: 0,
		total: 5,
	});

	const { result } = renderHook(() => useDepartmentsList({ filter: '', haveAll: true }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data[0].label).toBe('All'));
});

it('should include "None" item if haveNone is true', async () => {
	mockGetDepartments.mockResolvedValueOnce({
		departments: Array.from({ length: 5 }, () => createFakeDepartment()),
		count: 5,
		offset: 0,
		total: 5,
	});

	const { result } = renderHook(() => useDepartmentsList({ filter: '', haveNone: true }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data[0].label).toBe('None'));
});

it('should fetch the selected department if selectedDepartmentId is provided', async () => {
	const departmentsList = Array.from({ length: 10 }, () => createFakeDepartment());
	const departmentItems = departmentsList.map(formatDepartmentItem);
	const selectedDepartmentMock = createFakeDepartment({ _id: 'selected-department-id' });
	const selectedDepartmentItem = formatDepartmentItem(selectedDepartmentMock);

	mockGetDepartment.mockResolvedValueOnce({ department: selectedDepartmentMock });

	mockGetDepartments.mockResolvedValueOnce({
		departments: [...departmentsList, createFakeDepartment({ _id: 'selected-department-id' })],
		count: 10,
		offset: 0,
		total: 10,
	});

	const { result } = renderHook(() => useDepartmentsList({ filter: '', selectedDepartmentId: selectedDepartmentMock._id }), {
		wrapper: appRoot.build(),
	});

	await waitFor(() => expect(result.current.data).toEqual([...departmentItems, selectedDepartmentItem]));

	expect(mockGetDepartments).toHaveBeenCalled();
	expect(mockGetDepartment).toHaveBeenCalled();
});
