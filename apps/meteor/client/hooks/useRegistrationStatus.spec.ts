import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useRegistrationStatus } from './useRegistrationStatus';

describe('useRegistrationStatus hook', () => {
	it('should not call API and return error state when user does not have manage-cloud permission', async () => {
		const mockGetRegistrationStatus = jest.fn();

		const { result } = renderHook(() => useRegistrationStatus(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/cloud.registrationStatus', mockGetRegistrationStatus).withJohnDoe().build(),
		});

		expect(result.current.canViewRegistrationStatus).toBe(false);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.isRegistered).toBeFalsy();
		expect(mockGetRegistrationStatus).not.toHaveBeenCalled();
	});

	it('should call API and return registration status when user has manage-cloud permission', async () => {
		const mockGetRegistrationStatus = jest.fn().mockResolvedValue({
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

		expect(result.current.canViewRegistrationStatus).toBe(true);

		await waitFor(() => {
			expect(mockGetRegistrationStatus).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(result.current.isRegistered).toBe(true);
		});
	});

	it('should return isRegistered as false when workspace is not registered', async () => {
		const mockGetRegistrationStatus = jest.fn().mockResolvedValue({
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
			expect(result.current.isRegistered).toBe(false);
		});
	});
});
