import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useIsRoomAbacLocked } from './useIsRoomAbacLocked';
import { createFakeRoom } from '../../../../tests/mocks/data';

const hasLicenseModule = jest.fn(() => true);

jest.mock('../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: () => ({ data: hasLicenseModule() }),
}));

const booleanSetting = { packageValue: false, blocked: false, public: true, type: 'boolean' as const };
const multiLookupSetting = { packageValue: [], blocked: false, public: true, type: 'multiLookup' as const };

const buildAppRoot = ({ abacEnabled = true, enforceAllRooms = true, requiredAttributeKeys = [] as string[] } = {}) =>
	mockAppRoot()
		.withSetting('ABAC_Enabled', abacEnabled, booleanSetting)
		.withSetting('ABAC_Enforce_All_Rooms', enforceAllRooms, booleanSetting)
		.withSetting('ABAC_Required_Attributes', requiredAttributeKeys, multiLookupSetting)
		.build();

const privateRoomWithoutAttributes = createFakeRoom({ t: 'p', abacAttributes: [] });

describe('useIsRoomAbacLocked', () => {
	beforeEach(() => {
		hasLicenseModule.mockReturnValue(true);
	});

	it('should lock an attribute-less private room while enforcement is on', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes), { wrapper: buildAppRoot() });

		expect(result.current).toBe(true);
	});

	it('should not lock anything while ABAC_Enforce_All_Rooms is off', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes), {
			wrapper: buildAppRoot({ enforceAllRooms: false }),
		});

		expect(result.current).toBe(false);
	});

	it('should not lock anything while ABAC_Enabled is off', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes), {
			wrapper: buildAppRoot({ abacEnabled: false }),
		});

		expect(result.current).toBe(false);
	});

	it('should not lock anything without the abac license module', () => {
		hasLicenseModule.mockReturnValue(false);

		const { result } = renderHook(() => useIsRoomAbacLocked(privateRoomWithoutAttributes), { wrapper: buildAppRoot() });

		expect(result.current).toBe(false);
	});

	it('should read the required keys from ABAC_Required_Attributes', () => {
		const room = createFakeRoom({ t: 'p', abacAttributes: [{ key: 'clearance', values: ['SECRET'] }] });

		const { result: compliant } = renderHook(() => useIsRoomAbacLocked(room), {
			wrapper: buildAppRoot({ requiredAttributeKeys: ['clearance'] }),
		});
		const { result: missingOne } = renderHook(() => useIsRoomAbacLocked(room), {
			wrapper: buildAppRoot({ requiredAttributeKeys: ['clearance', 'releasability'] }),
		});

		expect(compliant.current).toBe(false);
		expect(missingOne.current).toBe(true);
	});

	it('should not lock a room the client has not loaded yet', () => {
		const { result } = renderHook(() => useIsRoomAbacLocked(undefined), { wrapper: buildAppRoot() });

		expect(result.current).toBe(false);
	});
});
