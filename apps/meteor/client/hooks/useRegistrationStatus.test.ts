import { describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { useRegistrationStatus } from './useRegistrationStatus';

describe('useRegistrationStatus', () => {
	it('should not call API and return error state when user does not have manage-cloud permission', async () => {
		const mockGetRegistrationStatus = fn<FunctionLike>();

		const { result } = renderHook(() => useRegistrationStatus(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/cloud.registrationStatus', mockGetRegistrationStatus).withJohnDoe().build(),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.canViewRegistrationStatus).toBe(false);
		expect(result.current.isRegistered).toBeFalsy();
		expect(mockGetRegistrationStatus).not.toHaveBeenCalled();
	});

	it('should call API and return isRegistered as true and canViewRegistrationStatus as true when workspace is registered and user has manage-cloud permission', async () => {
		const mockGetRegistrationStatus = fn<FunctionLike>().mockResolvedValue({
			registrationStatus: {
				workspaceRegistered: true,
			},
		});

		const { result } = renderHook(() => useRegistrationStatus(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/cloud.registrationStatus', mockGetRegistrationStatus)
				.withPermission('manage-cloud')
				.withJohnDoe()
				.build(),
		});

		await waitFor(() => {
			expect(mockGetRegistrationStatus).toHaveBeenCalled();
		});

		expect(result.current.isRegistered).toBe(true);
		expect(result.current.canViewRegistrationStatus).toBe(true);
	});

	it('should call API, return isRegistered as false and canViewRegistrationStatus as true when workspace is not registered and user has manage-cloud permission', async () => {
		const mockGetRegistrationStatus = fn<FunctionLike>().mockResolvedValue({
			registrationStatus: {
				workspaceRegistered: false,
			},
		});

		const { result } = renderHook(() => useRegistrationStatus(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/cloud.registrationStatus', mockGetRegistrationStatus)
				.withPermission('manage-cloud')
				.withJohnDoe()
				.build(),
		});

		await waitFor(() => {
			expect(mockGetRegistrationStatus).toHaveBeenCalled();
		});

		expect(result.current.isRegistered).toBe(false);
		expect(result.current.canViewRegistrationStatus).toBe(true);
	});
});
