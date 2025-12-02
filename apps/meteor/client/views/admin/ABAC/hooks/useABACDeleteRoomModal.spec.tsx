import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import useABACDeleteRoomModal from './useABACDeleteRoomModal';
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

describe('useABACDeleteRoomModal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNavigate.mockClear();
		mockSetModal.mockClear();
		mockDispatchToastMessage.mockClear();
		ABACAvailable = true;
	});

	it('should show delete confirmation modal when hook is called', async () => {
		const { result } = renderHook(() => useABACDeleteRoomModal(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', async () => null).build(),
		});

		result.current();

		await waitFor(() => {
			expect(mockSetModal).toHaveBeenCalled();
		});
	});

	it('should call delete endpoint when delete is confirmed', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);

		let confirmHandler: (() => void) | undefined;

		mockSetModal.mockImplementation((modal) => {
			if (modal?.props?.onConfirm) {
				confirmHandler = modal.props.onConfirm;
			}
		});

		const { result } = renderHook(() => useABACDeleteRoomModal(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
		});

		result.current();

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

		const { result } = renderHook(() => useABACDeleteRoomModal(mockRoom), {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
		});

		result.current();

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
