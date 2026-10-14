import { beforeEach, describe, it } from 'node:test';

import type { UseQueryResult } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const uiContextsMock = {
	usePermission: fn<FunctionLike>(),
};

const { usePermission } = uiContextsMock as unknown as typeof import('@rocket.chat/ui-contexts');

const _useHasLicenseModuleMock = {
	useHasLicenseModule: fn<FunctionLike>(),
};

const { useHasLicenseModule } = _useHasLicenseModuleMock as unknown as typeof import('../../../../../hooks/useHasLicenseModule');

const _useOmnichannelEnabledMock = {
	useOmnichannelEnabled: fn<FunctionLike>(),
};

const { useOmnichannelEnabled } = _useOmnichannelEnabledMock as unknown as typeof import('../../../hooks/useOmnichannelEnabled');

const { useOutboundMessageAccess } = proxyquire
	.noCallThru()
	.load<typeof import('./useOutboundMessageAccess')>('./useOutboundMessageAccess', {
		'@rocket.chat/ui-contexts': uiContextsMock,
		'../../../../../hooks/useHasLicenseModule': _useHasLicenseModuleMock,
		'../../../hooks/useOmnichannelEnabled': _useOmnichannelEnabledMock,
	});

const usePermissionMock = mocked(usePermission);
const useOmnichannelEnabledMock = mocked(useOmnichannelEnabled);
const useHasLicenseModuleMock = mocked(useHasLicenseModule);

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
		mocker.clearAllMocks();
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
