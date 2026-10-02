import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContext } from 'react';

import { useConnectionStatus } from './useConnectionStatus';
import type { ServerConnectionStatus, ServerContextValue } from '../ServerContext';
import { ServerContext } from '../ServerContext';

const createStatusStore = () => {
	let status: ServerConnectionStatus = { connected: true, status: 'connected', retryCount: 0 };
	const listeners = new Set<() => void>();

	return {
		subscribe: (onStoreChange: () => void) => {
			listeners.add(onStoreChange);
			return () => listeners.delete(onStoreChange);
		},
		getSnapshot: () => status,
		set: (next: ServerConnectionStatus) => {
			status = next;
			listeners.forEach((listener) => listener());
		},
	};
};

const renderWithStore = <T,>(hook: () => T) => {
	const store = createStatusStore();
	const notImplemented = () => {
		throw new Error('not implemented');
	};
	const value: ServerContextValue = {
		subscribeToConnectionStatus: store.subscribe,
		getConnectionStatus: store.getSnapshot,
		absoluteUrl: (path) => path,
		callEndpoint: notImplemented,
		uploadToEndpoint: notImplemented,
		getStream: () => () => () => undefined,
		getStreamAll: () => () => () => undefined,
		writeStream: notImplemented,
		disconnect: notImplemented,
		reconnect: notImplemented,
	};
	let renders = 0;
	const rendered = renderHook(
		() => {
			renders++;
			return hook();
		},
		{ wrapper: ({ children }: { children: ReactNode }) => <ServerContext.Provider value={value}>{children}</ServerContext.Provider> },
	);

	return { ...rendered, store, getRenders: () => renders };
};

const disconnected: ServerConnectionStatus = { connected: false, status: 'waiting', retryCount: 1, retryTime: 1000 };

it('follows the connection status', () => {
	const { result, store } = renderWithStore(() => useConnectionStatus());

	expect(result.current).toMatchObject({ connected: true, status: 'connected' });

	act(() => store.set(disconnected));

	expect(result.current).toMatchObject({ connected: false, status: 'waiting', retryTime: 1000 });
});

// The context value no longer carries the status, so the many server context readers stay put while it changes.
it('does not re-render server context readers that ignore the status', () => {
	const { store, getRenders } = renderWithStore(() => useContext(ServerContext).absoluteUrl);
	const rendersBefore = getRenders();

	act(() => store.set(disconnected));

	expect(getRenders()).toBe(rendersBefore);
});
