import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useIsRoomAbacLocked } from './useIsRoomAbacLocked';
import { createFakeRoom } from '../../../../tests/mocks/data';

const hasLicenseModule = jest.fn(() => true);

jest.mock('../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: () => ({ data: hasLicenseModule() }),
}));

const booleanSetting = { packageValue: false, blocked: false, public: true, type: 'boolean' as const };

const getRoomInfo = jest.fn();

const buildAppRoot = ({ abacEnabled = true, enforceAllRooms = true, requiredAttributeKeys = [] as string[] } = {}) =>
	mockAppRoot()
		.withSetting('ABAC_Enabled', abacEnabled, booleanSetting)
		.withSetting('ABAC_Enforce_All_Rooms', enforceAllRooms, booleanSetting)
		.withEndpoint('GET', '/v1/rooms.info', () => {
			getRoomInfo();
			return { room: null, abacRequiredAttributes: requiredAttributeKeys };
		})
		.build();

const privateRoomWithoutAttributes = createFakeRoom({ t: 'p', abacAttributes: [] });
const privateRoomWithAttributes = createFakeRoom({ t: 'p', abacAttributes: [{ key: 'clearance', values: ['SECRET'] }] });

describe('useIsRoomAbacLocked', () => {
	beforeEach(() => {
		hasLicenseModule.mockReturnValue(true);
		getRoomInfo.mockClear();
	});

	it('should not lock before rooms.info answers', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithAttributes._id, privateRoomWithAttributes), {
			wrapper: buildAppRoot({ requiredAttributeKeys: ['clearance', 'releasability'] }),
		});

		expect(result.current).toBe(false);
	});

	it('should only call rooms.info for a private room with attributes while enforcement is on', async () => {
		const publicRoom = createFakeRoom({ t: 'c' });

		renderHook(() => useIsRoomAbacLocked(publicRoom._id, publicRoom), { wrapper: buildAppRoot() });
		renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes._id, privateRoomWithoutAttributes), { wrapper: buildAppRoot() });
		renderHook(() => useIsRoomAbacLocked(privateRoomWithAttributes._id, privateRoomWithAttributes), {
			wrapper: buildAppRoot({ enforceAllRooms: false }),
		});
		expect(getRoomInfo).not.toHaveBeenCalled();

		renderHook(() => useIsRoomAbacLocked(privateRoomWithAttributes._id, privateRoomWithAttributes), { wrapper: buildAppRoot() });
		await waitFor(() => expect(getRoomInfo).toHaveBeenCalledTimes(1));
	});

	it('should lock an attribute-less private room while enforcement is on', async () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes._id, privateRoomWithoutAttributes), {
			wrapper: buildAppRoot(),
		});

		await waitFor(() => expect(result.current).toBe(true));
	});

	it('should not lock anything while ABAC_Enforce_All_Rooms is off', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes._id, privateRoomWithoutAttributes), {
			wrapper: buildAppRoot({ enforceAllRooms: false }),
		});

		expect(result.current).toBe(false);
	});

	it('should not lock anything while ABAC_Enabled is off', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes._id, privateRoomWithoutAttributes), {
			wrapper: buildAppRoot({ abacEnabled: false }),
		});

		expect(result.current).toBe(false);
	});

	it('should not lock anything without the abac license module', () => {
		hasLicenseModule.mockReturnValue(false);

		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes._id, privateRoomWithoutAttributes), {
			wrapper: buildAppRoot(),
		});

		expect(result.current).toBe(false);
	});

	it('should read the required keys from rooms.info', async () => {
		const room = privateRoomWithAttributes;

		const { result: compliant } = renderHook(() => useIsRoomAbacLocked(room._id, room), {
			wrapper: buildAppRoot({ requiredAttributeKeys: ['clearance'] }),
		});
		const { result: missingOne } = renderHook(() => useIsRoomAbacLocked(room._id, room), {
			wrapper: buildAppRoot({ requiredAttributeKeys: ['clearance', 'releasability'] }),
		});

		await waitFor(() => expect(missingOne.current).toBe(true));
		expect(compliant.current).toBe(false);
	});

	it('should not lock a room the client has not loaded yet', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes._id), { wrapper: buildAppRoot() });

		expect(result.current).toBe(false);
	});
});
