import { usePermission } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

import { useOutboundMessageAccess } from './useOutboundMessageAccess';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { useOmnichannelEnabled } from '../../../hooks/useOmnichannelEnabled';

jest.mock('@rocket.chat/ui-contexts', () => ({
	usePermission: jest.fn(),
}));

jest.mock('../../../hooks/useOmnichannelEnabled', () => ({
	useOmnichannelEnabled: jest.fn(),
}));

jest.mock('../../../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: jest.fn(),
}));

const usePermissionMock = jest.mocked(usePermission);
const useOmnichannelEnabledMock = jest.mocked(useOmnichannelEnabled);
const useHasLicenseModuleMock = jest.mocked(useHasLicenseModule);

// TODO: do not mock the hook itself, mock only its dependencies
const createSuccessfulQueryResult = (data: boolean): UseQueryResult<boolean, Error> => ({
	data,
	error: null,
	isPending: false,
	isError: false,
	isLoading: false,
	isLoadingError: false,
	isRefetchError: false,
	isSuccess: true,
	isPlaceholderData: false,
	isFetched: true,
	isFetchedAfterMount: true,
	isFetching: false,
	isInitialLoading: false,
	isPaused: false,
	isRefetching: false,
	isStale: false,
	status: 'success',
	dataUpdatedAt: Date.now(),
	errorUpdatedAt: Date.now(),
	failureCount: 0,
	failureReason: null,
	errorUpdateCount: 0,
	refetch: () => Promise.resolve(createSuccessfulQueryResult(data)),
	fetchStatus: 'idle',
	promise: Promise.resolve(data),
});

describe('useOutboundMessageAccess', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return false if omnichannel is not enabled', () => {
		useOmnichannelEnabledMock.mockReturnValue(false);
		useHasLicenseModuleMock.mockReturnValue(createSuccessfulQueryResult(true));
		usePermissionMock.mockReturnValue(true);

		const { result } = renderHook(() => useOutboundMessageAccess());
		expect(result.current).toBe(false);
	});

	it('should return true if omnichannel module is missing (upsell)', () => {
		useOmnichannelEnabledMock.mockReturnValue(true);
		useHasLicenseModuleMock.mockImplementation((module) => createSuccessfulQueryResult(module !== 'livechat-enterprise'));
		usePermissionMock.mockReturnValue(true);

		const { result } = renderHook(() => useOutboundMessageAccess());
		expect(result.current).toBe(true);
	});

	it('should return true if outbound module is missing (upsell)', () => {
		useOmnichannelEnabledMock.mockReturnValue(true);
		useHasLicenseModuleMock.mockImplementation((module) => createSuccessfulQueryResult(module !== 'outbound-messaging'));
		usePermissionMock.mockReturnValue(true);

		const { result } = renderHook(() => useOutboundMessageAccess());
		expect(result.current).toBe(true);
	});

	it('should return true if both modules are missing (upsell)', () => {
		useOmnichannelEnabledMock.mockReturnValue(true);
		useHasLicenseModuleMock.mockReturnValue(createSuccessfulQueryResult(false));
		usePermissionMock.mockReturnValue(true);

		const { result } = renderHook(() => useOutboundMessageAccess());
		expect(result.current).toBe(true);
	});

	it('should return true if all conditions are met and user has permission', () => {
		useOmnichannelEnabledMock.mockReturnValue(true);
		useHasLicenseModuleMock.mockReturnValue(createSuccessfulQueryResult(true));
		usePermissionMock.mockReturnValue(true);

		const { result } = renderHook(() => useOutboundMessageAccess());
		expect(result.current).toBe(true);
	});

	it('should return false if all conditions are met but user does not have permission', () => {
		useOmnichannelEnabledMock.mockReturnValue(true);
		useHasLicenseModuleMock.mockReturnValue(createSuccessfulQueryResult(true));
		usePermissionMock.mockReturnValue(false);

		const { result } = renderHook(() => useOutboundMessageAccess());
		expect(result.current).toBe(false);
	});
});
