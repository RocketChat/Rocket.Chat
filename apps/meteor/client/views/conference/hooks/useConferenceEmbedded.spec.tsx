import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useConferenceEmbedded } from './useConferenceEmbedded';

const callId = 'call-id';
// `ts` is required on a membership entry and arrives as a string over REST, so the fixture carries one.
const outsider = { _id: 'outsider-id', username: 'outsider', name: 'Outsider', ts: '2026-08-01T10:00:00.000Z' };

// The conference is read again after every change, so what the second read returns is the whole point: the
// first says a member can't see the chat, the second says the situation is resolved.
const buildInfo = (membersWithoutAccess: string[]) =>
	({
		_id: callId,
		type: 'videoconference',
		rid: 'room-id',
		title: '',
		createdBy: { _id: 'someone-else', username: 'someone.else', name: 'Someone Else' },
		users: [outsider],
		messages: { started: 'some-msg-id' },
		capabilities: {},
		chatAccess: {
			rid: 'room-id',
			name: 'general',
			type: 'c',
			membersWithoutAccess,
			canInvite: true,
		},
	}) as any;

const renderConference = () => {
	const streamRef: StreamControllerRef<'video-conference'> = {};
	// What the server would say right now. Set by the test, rather than derived from how many times the hook has
	// read — the hook reads whenever it has reason to, which is not the test's business.
	let membersWithoutAccess = [outsider._id];

	const result = renderHook(() => useConferenceEmbedded(callId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('video-conference', streamRef)
			.withEndpoint('GET', '/v1/video-conference.info', () => buildInfo(membersWithoutAccess))
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
			.build(),
	});

	return {
		...result,
		streamRef,
		resolveChatAccess: () => {
			membersWithoutAccess = [];
		},
	};
};

it('resolves the chat room and the members who cannot read it', async () => {
	const { result } = renderConference();

	await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
	await waitFor(() => expect(result.current.room.chatAccess?.members).toEqual([{ ...outsider, ts: new Date(outsider.ts) }]));
});

it('reads the conference again when it changes', async () => {
	const { result, streamRef, resolveChatAccess } = renderConference();

	await waitFor(() => expect(result.current.room.chatAccess?.members).toHaveLength(1));

	resolveChatAccess();

	// The event means "what you know about this conference is stale" — the chat moved, the same room became
	// readable, or the membership changed. Missing it leaves the UI wrong until the page is reloaded.
	streamRef.controller?.emit(`${callId}/updated`, []);

	await waitFor(() => expect(result.current.room.chatAccess?.members).toHaveLength(0));
});

// The stream is the window's only word on what the call is doing, and the server refuses a subscription it
// can't authorise rather than queueing it — a refusal that is never retried. So *when* the window subscribes
// is the whole of whether it ever hears anything.
describe('watching the conference', () => {
	const renderFor = (initialCallId: string) => {
		const streamRef: StreamControllerRef<'video-conference'> = {};

		return {
			streamRef,
			...renderHook(({ id }: { id: string }) => useConferenceEmbedded(id), {
				initialProps: { id: initialCallId },
				wrapper: mockAppRoot()
					.withJohnDoe()
					.withStream('video-conference', streamRef)
					.withEndpoint('GET', '/v1/video-conference.info', () => buildInfo([]))
					.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
					.build(),
			}),
		};
	};

	// `new` is the id the window carries before the call exists. The server looks the conference up by it, finds
	// nothing, and refuses — and nothing asks again, so the window would watch nothing for as long as it is open.
	it('asks about nothing while the call does not exist yet', async () => {
		const { result, streamRef } = renderFor('new');

		await waitFor(() => expect(result.current.room.loading).toBe(false));
		expect(streamRef.controller?.has('new/updated')).toBe(false);
	});

	it('starts watching as soon as the call is real', async () => {
		const { result, streamRef, rerender } = renderFor('new');

		await waitFor(() => expect(result.current.room.loading).toBe(false));

		rerender({ id: callId });

		await waitFor(() => expect(streamRef.controller?.has(`${callId}/updated`)).toBe(true));
	});
});

it('follows the chat to a discussion the conference moved into', async () => {
	const streamRef: StreamControllerRef<'video-conference'> = {};
	let discussionRid: string | undefined;

	const { result } = renderHook(() => useConferenceEmbedded(callId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('VideoConf_Persistent_Chat_Mode', 'main_room')
			.withStream('video-conference', streamRef)
			.withEndpoint('GET', '/v1/video-conference.info', () => ({ ...buildInfo([]), discussionRid }) as any)
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
			.build(),
	});

	await waitFor(() => expect(result.current.room.rid).toBe('room-id'));

	discussionRid = 'discussion-id';
	streamRef.controller?.emit(`${callId}/updated`, []);

	await waitFor(() => expect(result.current.room.rid).toBe('discussion-id'));
});

it('follows the chat to a discussion in thread mode too', async () => {
	const streamRef: StreamControllerRef<'video-conference'> = {};
	let discussionRid: string | undefined;

	const { result } = renderHook(() => useConferenceEmbedded(callId), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('VideoConf_Persistent_Chat_Mode', 'thread')
			.withStream('video-conference', streamRef)
			.withEndpoint('GET', '/v1/video-conference.info', () => ({ ...buildInfo([]), discussionRid }) as any)
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
			.build(),
	});

	await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
	expect(result.current.room.tmid).toBeDefined();

	discussionRid = 'discussion-id';
	streamRef.controller?.emit(`${callId}/updated`, []);

	await waitFor(() => expect(result.current.room.rid).toBe('discussion-id'));
	expect(result.current.room.tmid).toBeUndefined();
});

// Joining is the user's decision, made on the preflight screen: it is what turns their mic and camera choices
// into the provider's URL, and what marks them as present in the call.
describe('joining', () => {
	const renderForJoin = () => {
		const join = jest.fn(() => ({ url: 'https://call.example', providerName: 'test' }) as any);

		const { result } = renderHook(() => useConferenceEmbedded(callId), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint('GET', '/v1/video-conference.info', () => buildInfo([]))
				.withEndpoint('POST', '/v1/video-conference.join', join)
				.build(),
		});

		return { result, join };
	};

	it('does not happen until it is asked for', async () => {
		const { result, join } = renderForJoin();

		await waitFor(() => expect(result.current.room.rid).toBe('room-id'));

		expect(join).not.toHaveBeenCalled();
		expect(result.current.conference.url).toBeUndefined();
	});

	it('carries the preferences it was asked with', async () => {
		const { result, join } = renderForJoin();

		await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
		result.current.conference.join({ state: { mic: false, cam: true } });

		await waitFor(() => expect(join).toHaveBeenCalledWith({ callId, state: { mic: false, cam: true } }));
		await waitFor(() => expect(result.current.conference.url).toBe('https://call.example/?name=john.doe'));
	});

	it('says who may name the call', async () => {
		const { result } = renderForJoin();

		// `withJohnDoe` is the reader, and the fixture's conference was started by somebody else.
		await waitFor(() => expect(result.current.call.canRename).toBe(false));
	});
});

// Naming a call it can already see the name of: the field on the preflight, which reaches the server on the way
// into the call rather than as a separate action the user has to remember to take.
describe('naming on the way in', () => {
	const renderForRename = (rename: jest.Mock) => {
		const join = jest.fn(() => ({ url: 'https://call.example', providerName: 'test' }) as any);

		const { result } = renderHook(() => useConferenceEmbedded(callId), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint('GET', '/v1/video-conference.info', () => ({ ...buildInfo([]), title: 'general' }) as any)
				.withEndpoint('POST', '/v1/video-conference.join', join)
				.withEndpoint('POST', '/v1/video-conference.rename', rename)
				.build(),
		});

		return { result, join };
	};

	it('renames the call before joining it', async () => {
		const rename = jest.fn(() => ({ success: true }) as any);
		const { result, join } = renderForRename(rename);

		await waitFor(() => expect(result.current.call.name).toBe('general'));
		result.current.conference.join({ state: { mic: true, cam: false }, name: 'Release planning' });

		await waitFor(() => expect(rename).toHaveBeenCalledWith({ callId, title: 'Release planning' }));
		await waitFor(() => expect(join).toHaveBeenCalled());
	});

	it('says nothing to the server when the name was left alone', async () => {
		const rename = jest.fn(() => ({ success: true }) as any);
		const { result, join } = renderForRename(rename);

		await waitFor(() => expect(result.current.call.name).toBe('general'));
		result.current.conference.join({ state: { mic: true, cam: false }, name: 'general' });

		await waitFor(() => expect(join).toHaveBeenCalled());
		expect(rename).not.toHaveBeenCalled();
	});

	// The call is what the user actually asked for — a name that won't take is not worth being refused it over.
	it('joins anyway when the name would not take', async () => {
		const rename = jest.fn(() => {
			throw new Error('error-not-allowed');
		});
		const { result, join } = renderForRename(rename);

		await waitFor(() => expect(result.current.call.name).toBe('general'));
		result.current.conference.join({ state: { mic: true, cam: false }, name: 'Release planning' });

		await waitFor(() => expect(join).toHaveBeenCalled());
		await waitFor(() => expect(result.current.conference.url).toBe('https://call.example/?name=john.doe'));
	});
});

// What this window owes the call when it goes. The rule itself is pinned in `useLeaveConferenceOnClose.spec`;
// what matters here is which facts it is fed, because the obvious source — this window's own join — is not the
// only one that counts.
describe('how a departure from this window should be reported', () => {
	const self = { _id: 'john.doe', username: 'john.doe', name: 'John Doe', ts: '2026-08-01T10:00:00.000Z' };

	const renderWith = (users: Record<string, unknown>[], type = 'videoconference', createdBy = 'someone-else') =>
		renderHook(() => useConferenceEmbedded(callId), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint('GET', '/v1/video-conference.info', () => ({
					...buildInfo([]),
					type,
					createdBy: { _id: createdBy, username: createdBy, name: createdBy },
					users,
				}))
				.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any)
				.build(),
		});

	// The case that makes the server's answer necessary: a reload loses this window's join but not the membership
	// it recorded. Reporting nothing here leaves the call carrying someone who is gone.
	it('is leaving when the server already has this user in the call, reload or no reload', async () => {
		const { result } = renderWith([{ ...self, joined: true }]);

		await waitFor(() => expect(result.current.conference.departure).toBe('leave'));
	});

	// A membership they already left is history, not presence — so this is not a leave to report again.
	it('is not leaving on a membership this user already left', async () => {
		const { result } = renderWith([{ ...self, joined: true, leftAt: '2026-08-01T10:30:00.000Z' }]);

		await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
		expect(result.current.conference.departure).not.toBe('leave');
	});

	it('is declining for a member who was rung and has not joined', async () => {
		const { result } = renderWith([{ ...self, joined: false, ringingAt: new Date().toISOString() }]);

		await waitFor(() => expect(result.current.conference.departure).toBe('decline'));
	});

	it('is cancelling for the user placing a direct call', async () => {
		const { result } = renderWith([{ ...self, joined: false }], 'direct', 'john.doe');

		await waitFor(() => expect(result.current.conference.departure).toBe('cancel'));
	});

	it('is nothing for a member who was never asked and never arrived', async () => {
		const { result } = renderWith([{ ...self, joined: false }]);

		await waitFor(() => expect(result.current.room.rid).toBe('room-id'));
		expect(result.current.conference.departure).toBe('none');
	});
});
