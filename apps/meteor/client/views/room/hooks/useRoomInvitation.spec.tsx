import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useRoomInvitation } from './useRoomInvitation';
import { createFakeRoom } from '../../../../tests/mocks/data';
import { createDeferredPromise } from '../../../../tests/mocks/utils/createDeferredMockFn';

const mockInviteEndpoint = jest.fn();

describe('useRoomInvitation', () => {
	const mockedRoom = createFakeRoom();
	const roomId = mockedRoom._id;
	const appRoot = mockAppRoot().withEndpoint('POST', '/v1/rooms.invite', mockInviteEndpoint).build();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should call endpoint with accept action when acceptInvite is called', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => result.current.acceptInvite());

		await waitFor(() => expect(mockInviteEndpoint).toHaveBeenCalledWith({ roomId, action: 'accept' }));
	});

	it('should call endpoint with reject action when rejectInvite is called', async () => {
		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => result.current.rejectInvite());

		await waitFor(() => expect(mockInviteEndpoint).toHaveBeenCalledWith({ roomId, action: 'reject' }));
	});

	it('should return isPending as true when mutation is in progress', async () => {
		const deferred = createDeferredPromise();

		mockInviteEndpoint.mockReturnValueOnce(deferred.promise);

		const { result } = renderHook(() => useRoomInvitation(mockedRoom), { wrapper: appRoot });

		act(() => result.current.acceptInvite());

		await waitFor(() => expect(result.current.isPending).toBe(true));

		act(() => deferred.resolve());

		await waitFor(() => expect(result.current.isPending).toBe(false));
	});
});
