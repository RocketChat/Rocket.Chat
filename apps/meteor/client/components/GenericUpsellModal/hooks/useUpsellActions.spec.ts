import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { UseQueryResult } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useUpsellActions } from './useUpsellActions';
import { createFakeLicenseInfo } from '../../../../tests/mocks/data';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

jest.mock('../../../hooks/useIsEnterprise', () => ({
	useIsEnterprise: jest.fn(),
}));

const appRoot = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('GET', '/v1/licenses.info', async () => ({ license: createFakeLicenseInfo({ hasValidLicense: true }) }))
	.build();

describe('useUpsellActions hook', () => {
	beforeEach(() => {
		(useIsEnterprise as jest.Mock).mockImplementation(jest.requireActual('../../../hooks/useIsEnterprise').useIsEnterprise);
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should show upsell modal if not enterprise', () => {
		const { result } = renderHook(() => useUpsellActions(), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current.shouldShowUpsell).toBe(true);
		expect(result.current.cloudWorkspaceHadTrial).toBe(false);
	});

	it('should show upsell modal if enterprise but has no license module', async () => {
		const { result } = renderHook(() => useUpsellActions(false), {
			wrapper: appRoot,
		});

		await waitFor(() => {
			expect(result.current.shouldShowUpsell).toBe(true);
		});
	});

	it('should NOT show upsell if enterprise and has license module', async () => {
		const { result } = renderHook(() => useUpsellActions(true), {
			wrapper: appRoot,
		});

		await waitFor(() => {
			expect(result.current.shouldShowUpsell).toBe(false);
		});
	});

	it('should show upsell if useIsEnterprise is undefined', async () => {
		(useIsEnterprise as jest.Mock).mockReturnValue({
			data: undefined,
		} as UseQueryResult);

		const { result } = renderHook(() => useUpsellActions(true), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current.shouldShowUpsell).toBe(true);
	});
});
