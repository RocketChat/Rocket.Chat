import { useUserId } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useOTR } from './useOTR';
import OTR from '../../app/otr/client/OTR';
import { OtrRoomState } from '../../app/otr/lib/OtrRoomState';
import { useRoom } from '../views/room/contexts/RoomContext';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserId: jest.fn(),
}));

jest.mock('../views/room/contexts/RoomContext', () => ({
	useRoom: jest.fn(),
}));

jest.mock('../../app/otr/client/OTR', () => ({
	getInstanceByRoomId: jest.fn(),
}));

jest.mock('./useReactiveValue', () => ({
	useReactiveValue: jest.fn((fn) => fn()),
}));

describe('useOTR', () => {
	it('should return error state when user ID is not available', () => {
		(useUserId as jest.Mock).mockReturnValue(undefined);
		(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId' });

		const { result } = renderHook(() => useOTR());

		expect(result.current.otr).toBeUndefined();
		expect(result.current.otrState).toBe(OtrRoomState.ERROR);
	});

	it('should return error state when room ID is not available', () => {
		(useUserId as jest.Mock).mockReturnValue('userId');
		(useRoom as jest.Mock).mockReturnValue(undefined);

		const { result } = renderHook(() => useOTR());

		expect(result.current.otr).toBeUndefined();
		expect(result.current.otrState).toBe(OtrRoomState.ERROR);
	});

	it('should return error state when OTR instance is not available', () => {
		(useUserId as jest.Mock).mockReturnValue('userId');
		(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId' });
		(OTR.getInstanceByRoomId as jest.Mock).mockReturnValue(undefined);

		const { result } = renderHook(() => useOTR());

		expect(result.current.otr).toBeUndefined();
		expect(result.current.otrState).toBe(OtrRoomState.ERROR);
	});

	it('should return the correct OTR instance and state when available', () => {
		const mockOtrInstance = {
			getState: jest.fn().mockReturnValue(OtrRoomState.NOT_STARTED),
		};
		(useUserId as jest.Mock).mockReturnValue('userId');
		(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId' });
		(OTR.getInstanceByRoomId as jest.Mock).mockReturnValue(mockOtrInstance);

		const { result } = renderHook(() => useOTR());

		expect(result.current.otr).toBe(mockOtrInstance);
		expect(result.current.otrState).toBe(OtrRoomState.NOT_STARTED);
	});
});
