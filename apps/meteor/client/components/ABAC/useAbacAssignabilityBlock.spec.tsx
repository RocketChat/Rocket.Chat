import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useAbacAssignabilityBlock } from './useAbacAssignabilityBlock';
import { createFakeLicenseInfo } from '../../../tests/mocks/data';

const buildRoot = (attributes: { _id: string; key: string; values: string[] }[]) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('ABAC_Enabled', true)
		.withEndpoint('GET', '/v1/licenses.info', jest.fn().mockResolvedValue({ license: createFakeLicenseInfo({ activeModules: ['abac'] }) }))
		.withEndpoint(
			'GET',
			'/v1/abac/attributes',
			jest.fn().mockResolvedValue({ attributes, offset: 0, count: attributes.length, total: attributes.length }),
		)
		.build();

const clearance = { _id: 'a1', key: 'clearance', values: ['secret'] };

/**
 * ABAC-P4 QA — a user with no assignable attributes reached the attribute step and was shown a
 * picker with nothing in it and no explanation. The flow has to say why it cannot continue.
 */
describe('useAbacAssignabilityBlock', () => {
	it('does not block while the list is still loading', () => {
		const { result } = renderHook(() => useAbacAssignabilityBlock([]), { wrapper: buildRoot([clearance]) });

		expect(result.current).toEqual({ isBlocked: false, isLoading: true });
	});

	it('blocks when the user has nothing they could assign', async () => {
		const { result } = renderHook(() => useAbacAssignabilityBlock([]), { wrapper: buildRoot([]) });

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.isBlocked).toBe(true);
		expect(result.current.reason).toBe('ABAC_No_attributes_to_assign');
	});

	it('blocks when a workspace-required attribute is one the user does not hold', async () => {
		const { result } = renderHook(() => useAbacAssignabilityBlock(['clearance', 'caveat']), { wrapper: buildRoot([clearance]) });

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.isBlocked).toBe(true);
		expect(result.current.reason).toBe('ABAC_Missing_required_attributes');
	});

	it('does not block when the user holds every required attribute', async () => {
		const { result } = renderHook(() => useAbacAssignabilityBlock(['clearance']), { wrapper: buildRoot([clearance]) });

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.isBlocked).toBe(false);
		expect(result.current.reason).toBeUndefined();
	});

	it('does not block when the workspace requires nothing and the user holds something', async () => {
		const { result } = renderHook(() => useAbacAssignabilityBlock([]), { wrapper: buildRoot([clearance]) });

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.isBlocked).toBe(false);
	});
});
