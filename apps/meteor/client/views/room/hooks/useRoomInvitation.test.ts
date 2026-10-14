import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { createFakeRoom } from '../../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';
import { createDeferredPromise } from '../../../../tests/mocks/utils/createDeferredMockFn';

let useRoomInvitation: (typeof import('./useRoomInvitation'))['useRoomInvitation'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const mockOpenConfirmationModal = fn<FunctionLike>().mockResolvedValue(true);

const mockInviteEndpoint = fn<FunctionLike>();

const mockedNavigate = fn<FunctionLike>();

describe('useRoomInvitation', () => {
	before(() => {
		enterModuleScope();
		mock.module('./useRoomRejectInvitationModal', {
			exports: {
				useRoomRejectInvitationModal: () => ({
					open: mockOpenConfirmationModal,
					close: fn<FunctionLike>(),
				}),
			},
		});
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),

				useRouter: fn<FunctionLike>(() => ({
					navigate: mockedNavigate,
				})),
			},
		});
		({ useRoomInvitation } = require('./useRoomInvitation'));
	});

	after(leaveModuleScope);
	const mockedRoom = createFakeRoom();
	const roomId = mockedRoom._id;
	const appRoot = mockAppRoot().withEndpoint('POST', '/v1/rooms.invite', mockInviteEndpoint).build();

	beforeEach(() => {
		mocker.clearAllMocks();
	});

	it('should call endpoint with accept action when acceptInvite is called', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.acceptInvite());

		await waitFor(() => expect(mockInviteEndpoint).toHaveBeenCalledWith({ roomId, action: 'accept' }));
	});

	it('should call endpoint with reject action when rejectInvite is called', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.rejectInvite());

		await waitFor(() => expect(mockInviteEndpoint).toHaveBeenCalledWith({ roomId, action: 'reject' }));
	});

	it('should return isPending as true when mutation is in progress', async () => {
		const deferred = createDeferredPromise();

		mockInviteEndpoint.mockReturnValueOnce(deferred.promise);

		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.acceptInvite());

		await waitFor(() => expect(result.current.isPending).toBe(true));

		act(() => deferred.resolve());

		await waitFor(() => expect(result.current.isPending).toBe(false));
	});

	it('should open confirmation modal when rejecting an invite', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.rejectInvite());

		await waitFor(() => expect(mockOpenConfirmationModal).toHaveBeenCalled());
	});

	it('should not call reject endpoint if invitation rejection is cancelled', async () => {
		mockOpenConfirmationModal.mockResolvedValueOnce(false);

		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.rejectInvite());

		await waitFor(() => expect(mockInviteEndpoint).not.toHaveBeenCalled());
	});
});
