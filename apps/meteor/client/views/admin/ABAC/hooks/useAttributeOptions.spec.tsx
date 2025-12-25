import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useAttributeOptions } from './useAttributeOptions';
import { createFakeLicenseInfo } from '../../../../../tests/mocks/data';

const mockNavigate = jest.fn();
const mockSetModal = jest.fn();
const mockDispatchToastMessage = jest.fn();
const useIsABACAvailableMock = jest.fn(() => true);

jest.mock('./useIsABACAvailable', () => ({
	useIsABACAvailable: () => useIsABACAvailableMock(),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: () => ({
		navigate: mockNavigate,
	}),
	useSetModal: () => mockSetModal,
	useToastMessageDispatch: () => mockDispatchToastMessage,
}));

const mockAttribute = {
	_id: 'attribute-1',
	key: 'Room Type',
};

const baseAppRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Edit: 'Edit',
		Delete: 'Delete',
		ABAC_Attribute_deleted: 'Attribute {{attributeName}} deleted',
		ABAC_Cannot_delete_attribute: 'Cannot delete attribute',
		ABAC_Cannot_delete_attribute_content:
			'The attribute <bold>{{attributeName}}</bold> is currently in use and cannot be deleted. Please remove it from all rooms before deleting.',
		ABAC_Delete_room_attribute: 'Delete room attribute',
		ABAC_Delete_room_attribute_content:
			'Are you sure you want to delete the attribute <bold>{{attributeName}}</bold>? This action cannot be undone.',
		View_rooms: 'View rooms',
		Cancel: 'Cancel',
	})
	.withSetting('ABAC_Enabled', true, {
		packageValue: false,
		blocked: false,
		public: true,
		type: 'boolean',
		i18nLabel: 'ABAC_Enabled',
		i18nDescription: 'ABAC_Enabled_Description',
	})
	.withEndpoint('GET', '/v1/licenses.info', async () => ({
		license: createFakeLicenseInfo({ activeModules: ['abac'] }),
	}));

describe('useAttributeOptions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNavigate.mockClear();
		mockSetModal.mockClear();
		mockDispatchToastMessage.mockClear();
	});

	it('should return menu items with correct structure', () => {
		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', async () => null)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		expect(result.current).toHaveLength(2);
		expect(result.current[0]).toMatchObject({
			id: 'edit',
			icon: 'edit',
			content: 'Edit',
		});
		expect(result.current[1]).toMatchObject({
			id: 'delete',
			icon: 'trash',
			iconColor: 'danger',
		});
	});

	it('should enable edit when ABAC is available', async () => {
		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', async () => null)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		await waitFor(() => {
			expect(result.current[0].disabled).toBe(false);
		});
	});

	it('should navigate to edit page when edit action is clicked', async () => {
		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', async () => null)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		const editAction = result.current[0].onClick;
		if (editAction) {
			editAction();
		}

		expect(mockNavigate).toHaveBeenCalledWith(
			{
				name: 'admin-ABAC',
				params: {
					tab: 'room-attributes',
					context: 'edit',
					id: mockAttribute._id,
				},
			},
			{ replace: true },
		);
	});

	it('should disable edit when ABAC is not available', () => {
		useIsABACAvailableMock.mockReturnValue(false);
		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withSetting('ABAC_Enabled', false, {
					packageValue: false,
					blocked: false,
					public: true,
					type: 'boolean',
					i18nLabel: 'ABAC_Enabled',
					i18nDescription: 'ABAC_Enabled_Description',
				})
				.withEndpoint('GET', '/v1/licenses.info', async () => ({
					license: createFakeLicenseInfo({ activeModules: [] }),
				}))
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', async () => null)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		expect(result.current[0].disabled).toBe(true);
	});

	it('should show warning modal when delete is clicked and attribute is in use', async () => {
		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', async () => null)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: true }))
				.build(),
		});

		const deleteAction = result.current[1].onClick;
		if (deleteAction) {
			deleteAction();
		}

		await waitFor(() => {
			expect(mockSetModal).toHaveBeenCalled();
		});

		const modalCall = mockSetModal.mock.calls[0][0];
		expect(modalCall.props.variant).toBe('warning');
		expect(modalCall.props.title).toBe('Cannot delete attribute');
	});

	it('should show delete confirmation modal when delete is clicked and attribute is not in use', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);
		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', deleteEndpointMock)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		const deleteAction = result.current[1].onClick;
		if (deleteAction) {
			deleteAction();
		}

		await waitFor(() => {
			expect(mockSetModal).toHaveBeenCalled();
		});

		const modalCall = mockSetModal.mock.calls[0][0];
		expect(modalCall.props.variant).toBe('danger');
		expect(modalCall.props.title).toBe('Delete room attribute');
		expect(modalCall.props.confirmText).toBe('Delete');
	});

	it('should call delete endpoint when delete is confirmed', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);

		let confirmHandler: (() => void) | undefined;

		mockSetModal.mockImplementation((modal) => {
			if (modal?.props?.onConfirm) {
				confirmHandler = modal.props.onConfirm;
			}
		});

		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', deleteEndpointMock)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		const deleteAction = result.current[1].onClick;
		if (deleteAction) {
			deleteAction();
		}

		await waitFor(() => {
			expect(mockSetModal).toHaveBeenCalled();
		});

		if (confirmHandler) {
			confirmHandler();
		}

		await waitFor(() => {
			expect(deleteEndpointMock).toHaveBeenCalled();
		});
	});

	it('should show success toast when delete succeeds', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);

		let confirmHandler: (() => void) | undefined;

		mockSetModal.mockImplementation((modal) => {
			if (modal?.props?.onConfirm) {
				confirmHandler = modal.props.onConfirm;
			}
		});

		const { result } = renderHook(() => useAttributeOptions(mockAttribute), {
			wrapper: baseAppRoot
				.withEndpoint('DELETE', '/v1/abac/attributes/:_id', deleteEndpointMock)
				.withEndpoint('GET', '/v1/abac/attributes/:key/is-in-use', async () => ({ inUse: false }))
				.build(),
		});

		const deleteAction = result.current[1].onClick;
		if (deleteAction) {
			deleteAction();
		}

		await waitFor(() => {
			expect(mockSetModal).toHaveBeenCalled();
		});

		if (confirmHandler) {
			confirmHandler();
		}

		await waitFor(() => {
			expect(mockDispatchToastMessage).toHaveBeenCalledWith({
				type: 'success',
				message: 'Attribute Room Type deleted',
			});
		});
	});
});
