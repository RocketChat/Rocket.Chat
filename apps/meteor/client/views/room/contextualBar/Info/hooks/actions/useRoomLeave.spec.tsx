import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useRoomLeave } from './useRoomLeave';
import { createFakeRoom, createFakeSubscription } from '../../../../../../../tests/mocks/data';

const mockRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1' });
const mockSubscription = createFakeSubscription({ name: 'room1', t: 'c', disableNotifications: false, rid: 'room1' });

const mockSetModal = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...originalModule,
		useSetModal: () => mockSetModal,
	};
});

jest.mock('../../../../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

jest.mock('../../../../../../../client/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

describe('useRoomLeave', () => {
	beforeEach(() => {
		mockSetModal.mockClear();
	});

	it('should return leave function if user has subscription', () => {
		const wrapper = mockAppRoot()
			.withPermission('leave-c')
			.withSubscription({ ...mockSubscription, rid: 'room1' })
			.build();

		const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
		expect(typeof result.current).toBe('function');
	});

	it('should return null if user does not have subscription', () => {
		const wrapper = mockAppRoot().withPermission('leave-c').build();

		const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
		expect(result.current).toBeNull();
	});

	it('should render WarningModal with Callout warning if room is encrypted', () => {
		const mockEncryptedRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1', encrypted: true });
		const wrapper = mockAppRoot()
			.withPermission('leave-c')
			.withSubscription({ ...mockSubscription, rid: 'room1' })
			.withTranslations('en', 'core', {
				leaveWarning: 'Do you want to leave the room?',
				Leave_room: 'Leave',
				Cancel: 'Cancel',
				E2E_Leave_Encrypted_Room_Warning:
					'Leaving this encrypted room may remove locally stored encryption keys. You may lose access to previously encrypted message history if the keys are not available elsewhere.',
			})
			.build();

		const { result } = renderHook(() => useRoomLeave(mockEncryptedRoom), { wrapper });
		expect(typeof result.current).toBe('function');

		if (result.current) {
			result.current();
		}

		expect(mockSetModal).toHaveBeenCalledTimes(1);
		const modalElement = mockSetModal.mock.calls[0][0];
		expect(modalElement.props.text).toBeDefined();
	});

	it('should render WarningModal without Callout warning if room is not encrypted', () => {
		const wrapper = mockAppRoot()
			.withPermission('leave-c')
			.withSubscription({ ...mockSubscription, rid: 'room1' })
			.withTranslations('en', 'core', {
				leaveWarning: 'Do you want to leave the room?',
				Leave_room: 'Leave',
				Cancel: 'Cancel',
			})
			.build();

		const { result } = renderHook(() => useRoomLeave(mockRoom), { wrapper });
		expect(typeof result.current).toBe('function');

		if (result.current) {
			result.current();
		}

		expect(mockSetModal).toHaveBeenCalledTimes(1);
		const modalElement = mockSetModal.mock.calls[0][0];
		expect(modalElement.props.text).toBeDefined();
	});
});
