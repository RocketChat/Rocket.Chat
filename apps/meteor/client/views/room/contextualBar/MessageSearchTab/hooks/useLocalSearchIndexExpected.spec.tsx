import type { E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useLocalSearchIndexExpected } from './useLocalSearchIndexExpected';
import { createTestSearchBackend } from '../verification/testSearchBackend';

let mockBackend: ISearchIndexBackend | undefined;
let mockOptedIn = true;
const mockSubscribe = jest.fn((_workspace: string, _listener: () => void) => () => undefined);
const mockConsent = jest.fn((_workspace: string, _userId: string | undefined) => mockOptedIn);
jest.mock('../../../../../lib/absoluteUrl', () => ({ absoluteUrl: () => 'https://workspace.example/chat/' }));
jest.mock('../../../../../lib/e2eeSearch/getSearchIndexBackend', () => ({ getSearchIndexBackend: () => mockBackend }));
jest.mock('../../../../../lib/e2eeSearch/searchIndexOptIn', () => ({
	isSearchIndexOptedIn: (workspace: string, userId: string | undefined) => mockConsent(workspace, userId),
	subscribeToSearchIndexOptIn: (workspace: string, listener: () => void) => mockSubscribe(workspace, listener),
}));

beforeEach(() => {
	mockBackend = createTestSearchBackend();
	mockOptedIn = true;
	jest.clearAllMocks();
});
const wrapper = (allowed = true) => mockAppRoot().withJohnDoe().withSetting('E2E_Enable_Local_Search', allowed).build();

it('requires workspace enablement and workspace-scoped device consent', () => {
	const { result } = renderHook(useLocalSearchIndexExpected, { wrapper: wrapper() });
	expect(result.current).toBe(true);
	expect(mockConsent).toHaveBeenCalledWith('https://workspace.example/chat/', 'john.doe');
	expect(mockSubscribe).toHaveBeenCalledWith('https://workspace.example/chat/', expect.any(Function));
});

it('keeps the existing opt-out default', () => {
	const { result } = renderHook(useLocalSearchIndexExpected, { wrapper: mockAppRoot().build() });
	expect(result.current).toBe(false);
});

it('does not expect a local index without device consent', () => {
	mockOptedIn = false;
	const { result } = renderHook(useLocalSearchIndexExpected, { wrapper: wrapper() });
	expect(result.current).toBe(false);
});

it.each(['searchRecentPage', 'onIndexEvent', 'close'] as const)('preserves the legacy path when desktop lacks %s', (method) => {
	delete mockBackend![method];
	const { result } = renderHook(useLocalSearchIndexExpected, { wrapper: wrapper() });
	expect(result.current).toBe(false);
});

it.each([undefined, { recentCursor: 1, lifecycleEvents: 1 }, { recentCursor: 1, close: 1 }, { lifecycleEvents: 1, close: 1 }])(
	'preserves legacy search after an unsupported open report: %j',
	(capabilities) => {
		const opened = { schemaVersion: 1, encryptedAtRest: true, capabilities } as E2EESearchOpenResult;
		const { result } = renderHook(() => useLocalSearchIndexExpected(opened), { wrapper: wrapper() });
		expect(result.current).toBe(false);
	},
);

it('keeps a locked open without capabilities local', () => {
	const opened: E2EESearchOpenResult = { schemaVersion: 1, encryptedAtRest: true, locked: true };
	const { result } = renderHook(() => useLocalSearchIndexExpected(opened, 'locked'), { wrapper: wrapper() });
	expect(result.current).toBe(true);
});

it.each(['locked', 'unavailable'] as const)('keeps %s local even if the selector no longer returns a backend', (status) => {
	mockBackend = undefined;
	const { result } = renderHook(() => useLocalSearchIndexExpected(undefined, status), { wrapper: wrapper() });
	expect(result.current).toBe(true);
});

it.each(['searchRecentPage', 'onIndexEvent', 'close'] as const)('preserves legacy desktop behavior while locked without %s', (method) => {
	delete mockBackend![method];
	const opened: E2EESearchOpenResult = { schemaVersion: 1, encryptedAtRest: true, locked: true };
	const { result } = renderHook(() => useLocalSearchIndexExpected(opened, 'locked'), { wrapper: wrapper() });
	expect(result.current).toBe(false);
});

it.each(['locked', 'unavailable'] as const)('still requires device consent for %s availability', (status) => {
	mockOptedIn = false;
	const { result } = renderHook(() => useLocalSearchIndexExpected(undefined, status), { wrapper: wrapper() });
	expect(result.current).toBe(false);
});

it('does not create a fallback when the selector returns no backend', () => {
	mockBackend = undefined;
	const { result } = renderHook(useLocalSearchIndexExpected, { wrapper: wrapper() });
	expect(result.current).toBe(false);
});
