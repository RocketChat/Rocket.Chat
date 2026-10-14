import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let DeleteRoomModal: (typeof import('./DeleteRoomModal'))['default'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockDispatchToastMessage = fn<FunctionLike>();

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
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),
				useToastMessageDispatch: () => mockDispatchToastMessage,
			},
		});
		({ default: DeleteRoomModal } = require('./DeleteRoomModal'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	const rid = faker.database.mongodbObjectId();
	const roomName = 'Test Room';

	it('should render without crashing', (t) => {
		const { baseElement } = render(<DeleteRoomModal rid={rid} roomName={roomName} onClose={fn<FunctionLike>()} />, {
			wrapper: baseAppRoot.build(),
		});

		t.assert.snapshot(baseElement);
	});

	it('should call delete endpoint when delete is confirmed', async () => {
		const deleteEndpointMock = fn<FunctionLike>().mockResolvedValue(null);

		render(<DeleteRoomModal rid={rid} roomName={roomName} onClose={fn<FunctionLike>()} />, {
			wrapper: baseAppRoot.withEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', deleteEndpointMock).build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

		await waitFor(() => {
			expect(deleteEndpointMock).toHaveBeenCalled();
		});
	});

	it('should show success toast when delete succeeds', async () => {
		const deleteEndpointMock = fn<FunctionLike>().mockResolvedValue(null);

		render(<DeleteRoomModal rid={rid} roomName={roomName} onClose={fn<FunctionLike>()} />, {
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
