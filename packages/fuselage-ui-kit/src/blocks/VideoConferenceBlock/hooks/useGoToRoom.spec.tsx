import type { IRoom } from '@rocket.chat/core-typings';
import { MockedRouterContext, MockedServerContext } from '@rocket.chat/mock-providers';
import type { MockedRouterContextProps } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useGoToRoom } from './useGoToRoom';

const getWrapper =
	(room: Partial<IRoom> | undefined, router?: MockedRouterContextProps['router']) =>
	({ children }: { children: any }) => {
		return (
			<MockedServerContext handleRequest={async () => ({ room }) as any}>
				<MockedRouterContext router={router}>{children}</MockedRouterContext>
			</MockedServerContext>
		);
	};

describe('useGoToRoom', () => {
	it('should not navigate if the room is not found', async () => {
		const navigate = jest.fn();
		const { result } = renderHook(() => useGoToRoom(), { wrapper: getWrapper(undefined, { navigate }) });

		await result.current('room-id');

		expect(navigate).not.toHaveBeenCalled();
	});

	it('should build the route by name for channels (c) and navigate to it', async () => {
		const navigate = jest.fn();
		const getRoomRoute = jest.fn().mockReturnValue({ path: '/channel/some-channel' });
		const { result } = renderHook(() => useGoToRoom(), {
			wrapper: getWrapper({ _id: 'room-id', t: 'c', name: 'some-channel' }, { navigate, getRoomRoute }),
		});

		await result.current('room-id');

		await waitFor(() => expect(getRoomRoute).toHaveBeenCalledWith('c', { name: 'some-channel' }));
		expect(navigate).toHaveBeenCalledWith({ pathname: '/channel/some-channel' });
	});

	it('should build the route by name for private groups (p) and navigate to it', async () => {
		const navigate = jest.fn();
		const getRoomRoute = jest.fn().mockReturnValue({ path: '/group/some-group' });
		const { result } = renderHook(() => useGoToRoom(), {
			wrapper: getWrapper({ _id: 'room-id', t: 'p', name: 'some-group' }, { navigate, getRoomRoute }),
		});

		await result.current('room-id');

		await waitFor(() => expect(getRoomRoute).toHaveBeenCalledWith('p', { name: 'some-group' }));
		expect(navigate).toHaveBeenCalledWith({ pathname: '/group/some-group' });
	});

	it('should build the route by rid for direct messages (d) and navigate to it', async () => {
		const navigate = jest.fn();
		const getRoomRoute = jest.fn().mockReturnValue({ path: '/direct/room-id' });
		const { result } = renderHook(() => useGoToRoom(), {
			wrapper: getWrapper({ _id: 'room-id', t: 'd', name: 'some-user' }, { navigate, getRoomRoute }),
		});

		await result.current('room-id');

		await waitFor(() => expect(getRoomRoute).toHaveBeenCalledWith('d', { rid: 'room-id' }));
		expect(navigate).toHaveBeenCalledWith({ pathname: '/direct/room-id' });
	});
});
