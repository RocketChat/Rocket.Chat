import { normalizeDepartments } from './normalizeDepartments';

const initialDepartmentsToOption = Array.from({ length: 25 }, (_, index) => ({
	_id: `${index}`,
	label: `test_department_${index}`,
	value: `${index}`,
}));

const mockToastFn = jest.fn();
const mockTranslationFn = jest.fn((translation) => translation);
const mockGetDepartment = jest.fn();

const defaultProps = {
	departments: initialDepartmentsToOption,
	options: { filter: '' },
	getDepartment: mockGetDepartment,
	dispatchToastMessage: mockToastFn,
	t: mockTranslationFn as any,
	queryClient: {} as any,
};

beforeEach(() => {
	jest.clearAllMocks();
});

it('should add "All" option when haveAll is true', async () => {
	const allOption = {
		_id: '',
		label: 'All',
		value: 'all',
	};

	const result = await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			haveAll: true,
		},
	});

	expect(result).toContainEqual(allOption);
	expect(result).toHaveLength(26);
});

it('should add "None" option when haveNone is true', async () => {
	const noneOption = {
		_id: '',
		label: 'None',
		value: '',
	};

	const result = await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			haveNone: true,
		},
	});

	expect(result).toContainEqual(noneOption);
	expect(result).toHaveLength(26);
});

it('should not fetch department when no department is selected', async () => {
	const ensureQueryDataMock = jest.fn();

	const result = await normalizeDepartments({
		...defaultProps,
		queryClient: {
			ensureQueryData: ensureQueryDataMock,
		} as any,
	});

	expect(mockGetDepartment).not.toHaveBeenCalled();
	expect(ensureQueryDataMock).not.toHaveBeenCalled();
	expect(result).toEqual(initialDepartmentsToOption);
	expect(result).toHaveLength(25);
});

it('should not fetch department when "all" is selected', async () => {
	const ensureQueryDataMock = jest.fn();

	const result = await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			selectedDepartment: 'all',
		},
		queryClient: {
			ensureQueryData: ensureQueryDataMock,
		} as any,
	});

	expect(mockGetDepartment).not.toHaveBeenCalled();
	expect(ensureQueryDataMock).not.toHaveBeenCalled();
	expect(result).toEqual(initialDepartmentsToOption);
	expect(result).toHaveLength(25);
});

it('should not fetch department if it already exists in the list', async () => {
	const ensureQueryDataMock = jest.fn();
	const existingDepartment = {
		_id: '5',
		label: 'test_department_5',
		value: '5',
	};

	const result = await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			selectedDepartment: existingDepartment._id,
		},
		queryClient: {
			ensureQueryData: ensureQueryDataMock,
		} as any,
	});

	expect(mockGetDepartment).not.toHaveBeenCalled();
	expect(ensureQueryDataMock).not.toHaveBeenCalled();
	expect(result).toContainEqual(existingDepartment);
	expect(result).toHaveLength(25);
});

it('should fetch and add missing department to the list', async () => {
	const missingDepartment = {
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

	const expectedDepartmentOption = {
		_id: missingDepartment._id,
		label: missingDepartment.name,
		value: missingDepartment._id,
	};

	const ensureQueryDataMock = jest.fn().mockReturnValue({
		department: missingDepartment,
	});

	const result = await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			selectedDepartment: missingDepartment._id,
		},
		queryClient: {
			ensureQueryData: ensureQueryDataMock,
		} as any,
	});

	expect(result).toContainEqual(expectedDepartmentOption);
	expect(result).toHaveLength(26);
});

it('should show toast and reset department when selected department no longer exists', async () => {
	const setDepartmentMock = jest.fn();
	const ensureQueryDataMock = jest.fn().mockResolvedValue({ department: null });

	await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			selectedDepartment: 'non-existent-id',
			onChange: setDepartmentMock,
		},
		queryClient: {
			ensureQueryData: ensureQueryDataMock,
		} as any,
	});

	expect(setDepartmentMock).toHaveBeenCalledWith('all');
	expect(mockToastFn).toHaveBeenCalledWith({
		type: 'info',
		message: 'The_selected_department_no_longer_exists',
	});
});

it('should show error toast when department fetch fails', async () => {
	const error = new Error('Failed to fetch department');
	const ensureQueryDataMock = jest.fn().mockRejectedValue(error);

	await normalizeDepartments({
		...defaultProps,
		options: {
			...defaultProps.options,
			selectedDepartment: 'some-id',
		},
		queryClient: {
			ensureQueryData: ensureQueryDataMock,
		} as any,
	});

	expect(mockToastFn).toHaveBeenCalledWith({
		type: 'error',
		message: error,
	});
});
