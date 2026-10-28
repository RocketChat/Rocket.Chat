import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useDeleteRoomModal } from './useDeleteRoomModal';

const mockSetModal = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => {
	const originalModule = jest.requireActual('@rocket.chat/ui-contexts');
	return {
		...originalModule,
		useSetModal: () => mockSetModal,
	};
});

describe('useDeleteRoomModal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSetModal.mockClear();
	});

	it('should show delete confirmation modal when hook is called', async () => {
		const { result } = renderHook(
			() =>
				useDeleteRoomModal({
					rid: faker.database.mongodbObjectId(),
					name: faker.lorem.words(3),
				}),
			{
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', {
						Edit: 'Edit',
						Remove: 'Remove',
						ABAC_Room_removed: 'Room {{roomName}} removed from ABAC management',
						ABAC_Delete_room: 'Remove room from ABAC management',
						ABAC_Delete_room_annotation: 'Proceed with caution',
						ABAC_Delete_room_content:
							'Removing <bold>{{roomName}}</bold> from ABAC management may result in unintended users gaining access.',
						Cancel: 'Cancel',
					})
					.build(),
			},
		);

		result.current();

		await waitFor(() => {
			expect(mockSetModal).toHaveBeenCalled();
		});
	});
});
