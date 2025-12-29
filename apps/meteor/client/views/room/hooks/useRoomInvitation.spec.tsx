import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useRoomInvitation } from './useRoomInvitation';
import { createFakeRoom } from '../../../../tests/mocks/data';
import { createDeferredPromise } from '../../../../tests/mocks/utils/createDeferredMockFn';

const mockOpenConfirmationModal = jest.fn().mockResolvedValue(true);
jest.mock('./useRoomRejectInvitationModal', () => ({
	useRoomRejectInvitationModal: () => ({
		open: mockOpenConfirmationModal,
		close: jest.fn(),
	}),
}));

const mockInviteEndpoint = jest.fn();

const mockedNavigate = jest.fn();
jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: jest.fn(() => ({
		navigate: mockedNavigate,
	})),
}));

describe('useRoomInvitation', () => {
	const mockedRoom = createFakeRoom();
	const roomId = mockedRoom._id;
	const appRoot = mockAppRoot().withEndpoint('POST', '/v1/rooms.invite', mockInviteEndpoint).build();

	beforeEach(() => {
		jest.clearAllMocks();
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

	it('should redirect to /home after rejecting an invite', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.rejectInvite());

		await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/home'));
	});

	it('should not redirect to /home after accepting an invite', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => void result.current.acceptInvite());

		await waitFor(() => expect(mockedNavigate).not.toHaveBeenCalled());
	});
});
