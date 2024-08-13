import { useSetting, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { act, renderHook, waitFor } from '@testing-library/react';

import { E2EEState } from '../../../app/e2e/client/E2EEState';
import { e2e } from '../../../app/e2e/client/rocketchat.e2e';
import { OtrRoomState } from '../../../app/otr/lib/OtrRoomState';
import { dispatchToastMessage } from '../../lib/toast';
import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';
import { useE2EEState } from '../../views/room/hooks/useE2EEState';
import { useOTR } from '../useOTR';
import { useE2EERoomAction } from './useE2EERoomAction';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useSetting: jest.fn(),
	usePermission: jest.fn(),
	useEndpoint: jest.fn(),
}));

jest.mock('../../lib/toast', () => ({
	dispatchToastMessage: jest.fn(),
}));

jest.mock('../../views/room/contexts/RoomContext', () => ({
	useRoom: jest.fn(),
	useRoomSubscription: jest.fn(),
}));

jest.mock('../useOTR', () => ({
	useOTR: jest.fn(),
}));

jest.mock('../../../app/e2e/client/rocketchat.e2e', () => ({
	e2e: {
		isReady: jest.fn(),
	},
}));

jest.mock('../../views/room/hooks/useE2EEState', () => ({
	useE2EEState: jest.fn(),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

jest.mock('meteor/tracker', () => ({
	Tracker: {
		autorun: jest.fn(),
	},
}));

describe('useE2EERoomAction', () => {
	const mockRoom = { _id: 'roomId', encrypted: false, t: 'd', name: 'Test Room' };
	const mockSubscription = { autoTranslate: false };

	beforeEach(() => {
		(useSetting as jest.Mock).mockReturnValue(true);
		(useRoom as jest.Mock).mockReturnValue(mockRoom);
		(useRoomSubscription as jest.Mock).mockReturnValue(mockSubscription);
		(useE2EEState as jest.Mock).mockReturnValue(E2EEState.READY);
		(usePermission as jest.Mock).mockReturnValue(true);
		(useEndpoint as jest.Mock).mockReturnValue(jest.fn().mockResolvedValue({ success: true }));
		(e2e.isReady as jest.Mock).mockReturnValue(true);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should dispatch error toast message when otrState is ESTABLISHED', async () => {
		(useOTR as jest.Mock).mockReturnValue({ otrState: OtrRoomState.ESTABLISHED });

		const { result } = renderHook(() => useE2EERoomAction(), { legacyRoot: true });

		await act(async () => {
			await result?.current?.action?.();
		});

		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'E2EE_not_available_OTR' });
	});

	it('should dispatch error toast message when otrState is ESTABLISHING', async () => {
		(useOTR as jest.Mock).mockReturnValue({ otrState: OtrRoomState.ESTABLISHING });

		const { result } = renderHook(() => useE2EERoomAction(), { legacyRoot: true });

		act(() => {
			result?.current?.action?.();
		});

		await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'E2EE_not_available_OTR' }));
	});

	it('should dispatch error toast message when otrState is REQUESTED', async () => {
		(useOTR as jest.Mock).mockReturnValue({ otrState: OtrRoomState.REQUESTED });

		const { result } = renderHook(() => useE2EERoomAction(), { legacyRoot: true });

		act(() => {
			result?.current?.action?.();
		});

		await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'E2EE_not_available_OTR' }));
	});

	it('should dispatch success toast message when encryption is enabled', async () => {
		(useOTR as jest.Mock).mockReturnValue({ otrState: OtrRoomState.NOT_STARTED });

		const { result } = renderHook(() => useE2EERoomAction(), { legacyRoot: true });

		act(() => {
			result?.current?.action?.();
		});

		await waitFor(() =>
			expect(dispatchToastMessage).toHaveBeenCalledWith({
				type: 'success',
				message: 'E2E_Encryption_enabled_for_room',
			}),
		);
	});
});
