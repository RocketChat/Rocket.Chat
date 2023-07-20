import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { MockedAuthorizationContext } from '@rocket.chat/mock-providers/src/MockedAuthorizationContext';
import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import { MockedSettingsContext } from '@rocket.chat/mock-providers/src/MockedSettingsContext';
import { MockedUserContext } from '@rocket.chat/mock-providers/src/MockedUserContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { useSubscriptions } from './useSubscriptions';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});

beforeEach(() => {
	queryClient.clear();
});

it('should return an empty list of subscriptions', async () => {
	const { result, waitFor } = renderHook(() => useSubscriptions(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={(request) => {
						switch (true) {
							case request.method === 'GET' && request.pathPattern === '/v1/subscriptions.get':
								return {
									update: [],
								} as any;
							case request.method === 'GET' && request.pathPattern === '/v1/rooms.get':
								return {
									update: [],
								} as any;
						}
						throw new Error(`unhandled request ${request.method} ${request.pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit', 'can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.data));
	expect(result.current.data).toEqual([]);
});

it('should return a list of subscriptions merged with rooms', async () => {
	const { result, waitFor } = renderHook(() => useSubscriptions(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (request) => {
						switch (true) {
							case request.method === 'GET' && request.pathPattern === '/v1/subscriptions.get':
								const subscription: ISubscription = {
									_id: 'GENERAL_SUB',
									rid: 'GENERAL',
									u: {
										_id: 'rocket.cat',
										username: 'rocket.cat',
									},
									ts: new Date(),
									name: 'general',
									t: 'c',
									open: true,
									unread: 0,
									ls: new Date(),
									lr: new Date(),
									_updatedAt: new Date(),
									userMentions: 0,
									groupMentions: 0,
								};
								return { update: [subscription] } as any;
							case request.method === 'GET' && request.pathPattern === '/v1/rooms.get':
								const room: IRoom = {
									_id: 'GENERAL',
									name: 'general',
									t: 'c',
									msgs: 0,
									u: {
										_id: 'rocket.cat',
										username: 'rocket.cat',
									},
									ts: new Date(),
									_updatedAt: new Date(),
									usersCount: 1,
								};
								return { update: [room] } as any;
						}
						throw new Error(`unhandled request ${request.method} ${request.pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit', 'can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.data));
	expect(result.current.data?.length).toEqual(1);
	expect(result.current.data?.[0]).toEqual(
		expect.objectContaining({
			_id: 'GENERAL_SUB',
			rid: 'GENERAL',
			usersCount: 1,
		}),
	);
});

it('should contain one subscription received through subscription event', async () => {
	const ev = new Emitter();
	const { result, waitFor } = renderHook(() => useSubscriptions(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					emitter={ev}
					handleRequest={async (request) => {
						switch (true) {
							case request.method === 'GET' && request.pathPattern === '/v1/subscriptions.get':
								return {
									update: [],
								} as any;
							case request.method === 'GET' && request.pathPattern === '/v1/rooms.get':
								return {
									update: [],
								} as any;
						}
						throw new Error(`unhandled request ${request.method} ${request.pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit', 'can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	const subscription = {
		_id: 'GENERAL_SUB',
		rid: 'GENERAL',
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		ts: new Date(),
		name: 'general',
		t: 'c',
		open: true,
		unread: 0,
		ls: new Date(),
		lr: new Date(),
		_updatedAt: new Date(),
		userMentions: 0,
		groupMentions: 0,
	} as ISubscription;

	const room = {
		_id: 'GENERAL',
		name: 'general',
		t: 'c',
		msgs: 0,
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		ts: new Date(),
		_updatedAt: new Date(),
		usersCount: 1,
	} as IRoom;

	await waitFor(() => Boolean(result.current.data));

	act(() => {
		ev.emit('notify-user/john.doe/subscriptions-changed', ['inserted', subscription]);
	});

	expect(result.current.data?.length).toEqual(0);

	act(() => {
		ev.emit('notify-user/john.doe/rooms-changed', ['inserted', room]);
	});

	await waitFor(() => Boolean(result.current.data?.length));

	expect(result.current.data?.length).toEqual(1);
});

it('should update subscription when subscription event is received', async () => {
	const subscription = {
		_id: 'GENERAL_SUB',
		rid: 'GENERAL',
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		ts: new Date(),
		name: 'general',
		t: 'c',
		open: true,
		unread: 0,
		ls: new Date(),
		lr: new Date(),
		_updatedAt: new Date(),
		userMentions: 0,
		groupMentions: 0,
	} as ISubscription;

	const room = {
		_id: 'GENERAL',
		name: 'general',
		t: 'c',
		msgs: 0,
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		ts: new Date(),
		_updatedAt: new Date(),
		usersCount: 1,
	} as IRoom;
	const ev = new Emitter();
	const { result, waitFor, waitForNextUpdate } = renderHook(() => useSubscriptions(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					emitter={ev}
					handleRequest={async (request) => {
						switch (true) {
							case request.method === 'GET' && request.pathPattern === '/v1/subscriptions.get':
								return {
									update: [subscription],
								} as any;
							case request.method === 'GET' && request.pathPattern === '/v1/rooms.get':
								return {
									update: [room],
								} as any;
						}
						throw new Error(`unhandled request ${request.method} ${request.pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={['can-audit', 'can-audit-log']}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.data));

	expect(result.current.data?.length).toEqual(1);

	act(() => {
		ev.emit('notify-user/john.doe/subscriptions-changed', ['updated', { ...subscription, unread: 1 }]);
	});

	await waitForNextUpdate();

	expect(result.current.data?.[0]).toEqual(
		expect.objectContaining({
			_id: 'GENERAL_SUB',
			rid: 'GENERAL',
			usersCount: 1,
			unread: 1,
		}),
	);
});

it('should remove subscription when subscription event is received', async () => {
	const subscription = {
		_id: 'GENERAL_SUB',
		rid: 'GENERAL',
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		ts: new Date(),
		name: 'general',
		t: 'c',
		open: true,
		unread: 0,
		ls: new Date(),
		lr: new Date(),
		_updatedAt: new Date(),
		userMentions: 0,
		groupMentions: 0,
	} as ISubscription;

	const room = {
		_id: 'GENERAL',
		name: 'general',
		t: 'c',
		msgs: 0,
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
		ts: new Date(),
		_updatedAt: new Date(),
		usersCount: 1,
	} as IRoom;
	const ev = new Emitter();
	const { result, waitFor, waitForNextUpdate } = renderHook(() => useSubscriptions(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					emitter={ev}
					handleRequest={async (request) => {
						switch (true) {
							case request.method === 'GET' && request.pathPattern === '/v1/subscriptions.get':
								return { update: [subscription] } as any;
							case request.method === 'GET' && request.pathPattern === '/v1/rooms.get':
								return { update: [room] } as any;
						}
						throw new Error(`unhandled request ${request.method} ${request.pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>
						<MockedUserContext userPreferences={{}}>
							<MockedAuthorizationContext permissions={[]}>{children}</MockedAuthorizationContext>
						</MockedUserContext>
					</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.data));

	expect(result.current.data?.length).toEqual(1);

	act(() => {
		ev.emit('notify-user/john.doe/subscriptions-changed', ['removed', { ...subscription }]);
		ev.emit('notify-user/john.doe/rooms-changed', ['removed', { ...room }]);
	});

	await waitForNextUpdate();

	expect(result.current.data?.length).toEqual(0);
});

it('should return rooms if the user is anonymous', async () => {
	const { result, waitFor } = renderHook(() => useSubscriptions(), {
		wrapper: ({ children }) => (
			<QueryClientProvider client={queryClient}>
				<MockedServerContext
					handleRequest={async (request) => {
						switch (true) {
							case request.method === 'GET' && request.pathPattern === '/v1/subscriptions.get':
								throw new Error('unauthorized');
							case request.method === 'GET' && request.pathPattern === '/v1/rooms.get':
								const room: IRoom = {
									_id: 'GENERAL',
									name: 'general',
									t: 'c',
									msgs: 0,
									u: {
										_id: 'rocket.cat',
										username: 'rocket.cat',
									},
									ts: new Date(),
									_updatedAt: new Date(),
									usersCount: 1,
								};
								return { update: [room] } as any;
						}
						throw new Error(`unhandled request ${request.method} ${request.pathPattern}`);
					}}
				>
					<MockedSettingsContext settings={{}}>{children}</MockedSettingsContext>
				</MockedServerContext>
			</QueryClientProvider>
		),
	});

	await waitFor(() => Boolean(result.current.data));
	expect(result.current.data?.length).toEqual(1);
	expect(result.current.data?.[0]).toEqual(
		expect.objectContaining({
			_id: 'GENERAL',
			rid: 'GENERAL',
			usersCount: 1,
		}),
	);
});
