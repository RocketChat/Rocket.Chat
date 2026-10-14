import { after, beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { UseQueryResult } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import proxyquire from 'proxyquire';

import { createFakeLicenseInfo } from '../../../../tests/mocks/data';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const appRoot = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('GET', '/v1/licenses.info', async () => ({ license: createFakeLicenseInfo({ hasValidLicense: true }) }))
	.build();

const useIsEnterpriseMock = {
	useIsEnterprise: fn<FunctionLike>(),
};

const { useIsEnterprise } = useIsEnterpriseMock as unknown as typeof import('../../../hooks/useIsEnterprise');

const { useUpsellActions } = proxyquire.noCallThru().load<typeof import('./useUpsellActions')>('./useUpsellActions', {
	'../../../hooks/useIsEnterprise': useIsEnterpriseMock,
});

describe('useUpsellActions hook', () => {
	beforeEach(() => {
		(useIsEnterprise as Mock<FunctionLike>).mockImplementation(require('../../../hooks/useIsEnterprise').useIsEnterprise);
	});

	after(() => {
		mocker.clearAllMocks();
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
		(useIsEnterprise as Mock<FunctionLike>).mockReturnValue({
			data: undefined,
		} as UseQueryResult);

		const { result } = renderHook(() => useUpsellActions(true), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current.shouldShowUpsell).toBe(true);
	});
});
