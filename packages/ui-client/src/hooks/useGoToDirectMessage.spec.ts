import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useGoToDirectMessage } from './useGoToDirectMessage';

it('should return undefined if username is not provided', () => {
	const { result } = renderHook(() => useGoToDirectMessage({}), {
		wrapper: mockAppRoot().build(),
	});

	expect(result.current).toBe(undefined);
});

it("should return undefined if the user doesn't have permission to create direct messages and doesn't have a subscription with target user", () => {
	const { result } = renderHook(() => useGoToDirectMessage({ username: 'test' }), {
		wrapper: mockAppRoot().build(),
	});

	expect(result.current).toBe(undefined);
});

it('should return undefined if the room is already open', () => {
	const { result } = renderHook(() => useGoToDirectMessage({ username: 'test' }, 'test-room'), {
		wrapper: mockAppRoot()
			.withSubscription({ _id: 'test-room', name: 'test', t: 'd', rid: 'test-room' } as SubscriptionWithRoom)
			.build(),
	});

	expect(result.current).toBe(undefined);
});

it('should return a function to navigate to the direct message room if the user has permission to create direct messages and no subscription with target user', () => {
	const { result } = renderHook(() => useGoToDirectMessage({ username: 'test' }), {
		wrapper: mockAppRoot().withPermission('create-d').build(),
	});

	expect(typeof result.current).toBe('function');
});

it("should return a function to navigate to the direct message room if the user has a subscription with target user and doesn't have permission to create direct messages", () => {
	const { result } = renderHook(() => useGoToDirectMessage({ username: 'test' }), {
		wrapper: mockAppRoot()
			.withSubscription({ _id: 'test-room', name: 'test', t: 'd', rid: 'test-room' } as SubscriptionWithRoom)
			.build(),
	});

	expect(typeof result.current).toBe('function');
});
