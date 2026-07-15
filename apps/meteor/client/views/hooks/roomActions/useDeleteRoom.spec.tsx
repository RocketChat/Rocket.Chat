import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useDeleteRoom } from './useDeleteRoom';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1' });

const mockSetModal = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...originalModule,
		useSetModal: () => mockSetModal,
	};
});

jest.mock('../../../hooks/useTeamInfoQuery', () => ({
	useTeamInfoQuery: () => ({ data: null }),
}));

jest.mock('../../teams/contextualBar/info/DeleteTeam', () => () => null);

describe('useDeleteRoom', () => {
	beforeEach(() => {
		mockSetModal.mockClear();
	});

	it('should render GenericModal with Callout warning if room is encrypted', () => {
		const mockEncryptedRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1', encrypted: true });
		const wrapper = mockAppRoot()
			.withPermission('delete-c')
			.withTranslations('en', 'core', {
				Delete_roomType: 'Delete {{roomType}}',
				Yes_delete_it: 'Yes',
				Cancel: 'Cancel',
				Delete_Room_Warning: 'Are you sure?',
				E2E_Delete_Encrypted_Room_Warning:
					'Deleting this encrypted room may remove locally stored encryption keys. You may lose access to previously encrypted message history if the keys are not available elsewhere.',
			})
			.build();

		const { result } = renderHook(() => useDeleteRoom(mockEncryptedRoom), { wrapper });
		expect(typeof result.current.handleDelete).toBe('function');

		result.current.handleDelete();

		expect(mockSetModal).toHaveBeenCalledTimes(1);
		const modalElement = mockSetModal.mock.calls[0][0];
		expect(modalElement.props.children).toBeDefined();
	});

	it('should render GenericModal without Callout warning if room is not encrypted', () => {
		const wrapper = mockAppRoot()
			.withPermission('delete-c')
			.withTranslations('en', 'core', {
				Delete_roomType: 'Delete {{roomType}}',
				Yes_delete_it: 'Yes',
				Cancel: 'Cancel',
				Delete_Room_Warning: 'Are you sure?',
			})
			.build();

		const { result } = renderHook(() => useDeleteRoom(mockRoom), { wrapper });
		expect(typeof result.current.handleDelete).toBe('function');

		result.current.handleDelete();

		expect(mockSetModal).toHaveBeenCalledTimes(1);
		const modalElement = mockSetModal.mock.calls[0][0];
		expect(modalElement.props.children).toBeDefined();
	});
});
