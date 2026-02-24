import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DeleteRoomModal from './DeleteRoomModal';

const mockDispatchToastMessage = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useToastMessageDispatch: () => mockDispatchToastMessage,
}));

const baseAppRoot = mockAppRoot().withTranslations('en', 'core', {
	Edit: 'Edit',
	Remove: 'Remove',
	ABAC_Room_removed: 'Room {{roomName}} removed from ABAC management',
	ABAC_Delete_room: 'Remove room from ABAC management',
	ABAC_Delete_room_annotation: 'Proceed with caution',
	ABAC_Delete_room_content: 'Removing <bold>{{roomName}}</bold> from ABAC management may result in unintended users gaining access.',
	Cancel: 'Cancel',
});

describe('DeleteRoomModal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const rid = faker.database.mongodbObjectId();
	const roomName = 'Test Room';

	it('should render without crashing', () => {
		const { baseElement } = render(<DeleteRoomModal rid={rid} roomName={roomName} onClose={jest.fn()} />, {
			wrapper: baseAppRoot.build(),
		});

		expect(baseElement).toMatchSnapshot();
	});

	it('should call delete endpoint when delete is confirmed', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);

		render(<DeleteRoomModal rid={rid} roomName={roomName} onClose={jest.fn()} />, {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

		await waitFor(() => {
			expect(deleteEndpointMock).toHaveBeenCalled();
		});
	});

	it('should show success toast when delete succeeds', async () => {
		const deleteEndpointMock = jest.fn().mockResolvedValue(null);

		render(<DeleteRoomModal rid={rid} roomName={roomName} onClose={jest.fn()} />, {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

		await waitFor(() => {
			expect(mockDispatchToastMessage).toHaveBeenCalledWith({
				type: 'success',
				message: 'Room Test Room removed from ABAC management',
			});
		});
	});
});
