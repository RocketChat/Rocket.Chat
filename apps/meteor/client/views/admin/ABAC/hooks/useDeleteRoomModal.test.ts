import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { faker } from '@faker-js/faker';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let useDeleteRoomModal: (typeof import('./useDeleteRoomModal'))['useDeleteRoomModal'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockSetModal = fn<FunctionLike>();

describe('useDeleteRoomModal', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				default: (() => {
					const originalModule = require('@rocket.chat/ui-contexts');
					return {
						...originalModule,
						useSetModal: () => mockSetModal,
					};
				})(),
			},
		});
		({ useDeleteRoomModal } = require('./useDeleteRoomModal'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();
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
