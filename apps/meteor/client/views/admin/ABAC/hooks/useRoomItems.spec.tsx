import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import useRoomItems from './useRoomItems';
import { createFakeLicenseInfo } from '../../../../../tests/mocks/data';

const mockNavigate = jest.fn();
const mockSetModal = jest.fn();
const mockDispatchToastMessage = jest.fn();

let ABACAvailable = true;

jest.mock('./useIsABACAvailable', () => jest.fn(() => ABACAvailable));

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...originalModule,
		useRouter: () => ({
			navigate: mockNavigate,
		}),
		useSetModal: () => mockSetModal,
		useToastMessageDispatch: () => mockDispatchToastMessage,
	};
});

const mockRoom = {
	rid: 'room-1',
	name: 'Test Room',
};

const baseAppRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Edit: 'Edit',
		Remove: 'Remove',
		ABAC_Room_removed: 'Room {{roomName}} removed from ABAC management',
		ABAC_Delete_room: 'Remove room from ABAC management',
		ABAC_Delete_room_annotation: 'Proceed with caution',
		ABAC_Delete_room_content: 'Removing <bold>{{roomName}}</bold> from ABAC management may result in unintended users gaining access.',
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

describe('useRoomItems', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNavigate.mockClear();
		mockSetModal.mockClear();
		mockDispatchToastMessage.mockClear();
		ABACAvailable = true;
	});

	it('should return menu items with correct structure', () => {
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', async () => null).build(),
		});

		expect(result.current).toHaveLength(2);
		expect(result.current[0]).toMatchObject({
			id: 'edit',
			icon: 'edit',
			content: 'Edit',
		});
		expect(result.current[1]).toMatchObject({
			id: 'delete',
			icon: 'cross',
			iconColor: 'danger',
		});
	});

	it('should enable edit when ABAC is available', async () => {
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', async () => null).build(),
		});

		await waitFor(() => {
			expect(result.current[0].disabled).toBe(false);
		});
	});

	it('should navigate to edit page when edit action is clicked', async () => {
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', async () => null).build(),
		});

		const editAction = result.current[0].onClick;
		if (editAction) {
			editAction();
		}

		expect(mockNavigate).toHaveBeenCalledWith(
			{
				name: 'admin-ABAC',
				params: {
					tab: 'rooms',
					context: 'edit',
					id: mockRoom.rid,
				},
			},
			{ replace: true },
		);
	});

	it('should disable edit when ABAC is not available', () => {
		ABACAvailable = false;
		const { result } = renderHook(() => useRoomItems(mockRoom), {
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
				.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', async () => null)
				.build(),
		});

		expect(result.current[0].disabled).toBe(true);
	});

	it('should show delete confirmation modal when delete is clicked', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
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
		expect(modalCall.props.title).toBe('Remove room from ABAC management');
		expect(modalCall.props.annotation).toBe('Proceed with caution');
		expect(modalCall.props.confirmText).toBe('Remove');
	});

	it('should call delete endpoint when delete is confirmed', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);

		let confirmHandler: (() => void) | undefined;

		mockSetModal.mockImplementation((modal) => {
			if (modal?.props?.onConfirm) {
				confirmHandler = modal.props.onConfirm;
			}
		});

		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
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

		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
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
				message: 'Room Test Room removed from ABAC management',
			});
		});
	});
});
