import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useRoomToolbox, useRoomToolboxActions } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import RoomToolboxProvider from './RoomToolboxProvider';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';

jest.mock('./hooks/useCoreRoomActions', () => ({ useCoreRoomActions: () => [] }));
jest.mock('./hooks/useAppsRoomActions', () => ({ useAppsRoomActions: () => [] }));
jest.mock('./hooks/useCoreRoomRoutes', () => ({ useCoreRoomRoutes: () => [] }));

const renderToolbox = (navigate = jest.fn()) =>
	renderHook(() => ({ actions: useRoomToolboxActions(), toolbox: useRoomToolbox() }), {
		wrapper: mockAppRoot()
			.withRouter({ navigate, getRouteName: () => 'channel', getRouteParameters: () => ({ name: 'general' }) })
			.wrap((children) => (
				<FakeRoomProvider>
					<RoomToolboxProvider>{children}</RoomToolboxProvider>
				</FakeRoomProvider>
			))
			.build(),
	});

describe('RoomToolboxProvider', () => {
	it('should open and close tabs through the actions context', () => {
		const navigate = jest.fn();
		const { result } = renderToolbox(navigate);

		act(() => result.current.actions.openTab('members-list', 'user1'));
		expect(navigate).toHaveBeenLastCalledWith(
			expect.objectContaining({ name: 'channel', params: { name: 'general', tab: 'members-list', context: 'user1' } }),
		);

		act(() => result.current.actions.closeTab());
		expect(navigate).toHaveBeenLastCalledWith(expect.objectContaining({ params: { name: 'general', tab: '', context: '' } }));
	});

	it('should keep the same actions value across re-renders', () => {
		const { result, rerender } = renderToolbox();
		const { actions } = result.current;

		rerender();

		expect(result.current.actions).toBe(actions);
		expect(result.current.toolbox.openTab).toBe(actions.openTab);
		expect(result.current.toolbox.closeTab).toBe(actions.closeTab);
	});
});

describe('useRoomToolboxActions', () => {
	it('should fall back to no-op actions outside a room', () => {
		const { result } = renderHook(() => useRoomToolboxActions(), { wrapper: mockAppRoot().build() });

		expect(() => result.current.closeTab()).not.toThrow();
	});
});
