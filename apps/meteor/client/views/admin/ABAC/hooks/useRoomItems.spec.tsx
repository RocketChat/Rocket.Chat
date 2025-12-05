import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useRoomItems } from './useRoomItems';

const navigateMock = jest.fn();
const setDeleteRoomModalMock = jest.fn();
const useIsABACAvailableMock = jest.fn(() => true);

jest.mock('./useIsABACAvailable', () => ({
	useIsABACAvailable: () => useIsABACAvailableMock(),
}));
jest.mock('./useDeleteRoomModal', () => ({
	useDeleteRoomModal: () => setDeleteRoomModalMock,
}));
jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: () => ({
		navigate: navigateMock,
	}),
}));

const mockRoom = {
	rid: faker.database.mongodbObjectId(),
	name: 'Test Room',
};

const createAppRoot = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			Edit: 'Edit',
			Remove: 'Remove',
			ABAC_Room_removed: 'Room {{roomName}} removed from ABAC management',
			ABAC_Delete_room: 'Remove room from ABAC management',
			ABAC_Delete_room_annotation: 'Proceed with caution',
			ABAC_Delete_room_content: 'Removing <bold>{{roomName}}</bold> from ABAC management may result in unintended users gaining access.',
			Cancel: 'Cancel',
		})
		.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', async () => null);

describe('useRoomItems', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		navigateMock.mockClear();
		useIsABACAvailableMock.mockReturnValue(true);
	});

	it('should return menu items with correct structure', () => {
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: createAppRoot().build(),
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
			wrapper: createAppRoot().build(),
		});

		await waitFor(() => {
			expect(result.current[0].disabled).toBe(false);
		});
	});

	it('should navigate to edit page when edit action is clicked', async () => {
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: createAppRoot().build(),
		});

		const editAction = result.current[0].onClick;
		if (editAction) {
			editAction();
		}

		expect(navigateMock).toHaveBeenCalledWith(
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
		useIsABACAvailableMock.mockReturnValue(false);

		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: createAppRoot().build(),
		});

		expect(result.current[0].disabled).toBe(true);
	});

	it('should show delete modal when delete is clicked', async () => {
		const { result } = renderHook(() => useRoomItems(mockRoom), {
			wrapper: createAppRoot().build(),
		});

		const deleteAction = result.current[1].onClick;
		if (deleteAction) {
			deleteAction();
		}

		await waitFor(() => {
			expect(setDeleteRoomModalMock).toHaveBeenCalled();
		});
	});
});
