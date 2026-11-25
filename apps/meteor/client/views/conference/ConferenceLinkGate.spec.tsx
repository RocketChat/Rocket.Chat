import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ConferenceWindow } from '@rocket.chat/ui-conference';
import { videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { QueryClient } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import ConferenceLinkGate from './ConferenceLinkGate';
import ConferenceProvider from './providers/ConferenceProvider';

const mockWindowMounted = jest.fn();
const mockWindowRendered = jest.fn();

// The window itself is the package's and is specified there; what matters here is which call it was handed, and
// whether it had to load the conference again.
jest.mock('@rocket.chat/ui-conference', () => {
	const actual = jest.requireActual('@rocket.chat/ui-conference');
	const { useEffect } = jest.requireActual('react');

	return {
		...actual,
		ConferenceWindow: () => {
			const { callId, room } = actual.useConference();
			useEffect(() => mockWindowMounted(), []);
			mockWindowRendered(room.loading ? 'loading' : 'loaded');

			return <p>{`window for ${callId}, ${room.loading ? 'loading' : 'loaded'}`}</p>;
		},
	};
});

// The chat is a slot the stub window never renders, and it reaches far into the room's message list.
jest.mock('./ConferenceChat', () => ({ __esModule: true, default: () => null }));

jest.mock('./lib/callWindow', () => ({
	...jest.requireActual('./lib/callWindow'),
	closeCallWindow: jest.fn(),
}));

const chatAccess = { rid: 'room-id', name: 'general', type: 'c', membersWithoutAccess: [], canInvite: true };
const createdBy = { _id: 'creator', username: 'creator', name: 'Creator' };

const liveConference = {
	_id: 'call-id',
	type: 'videoconference',
	status: 1,
	rid: 'room-id',
	title: 'Weekly sync',
	providerName: 'test',
	createdAt: '2026-11-25T10:00:00.000Z',
	createdBy,
	users: [],
	messages: { started: 'msg-id' },
	anonymousUsers: 0,
	conferenceRoomId: 'link-id',
	customUrl: 'weekly-sync',
	capabilities: { mic: true, cam: true },
	chatAccess,
} as any;

const notStarted = (canStart?: boolean) =>
	({
		...liveConference,
		_id: 'link-id',
		status: 5,
		messages: {},
		...(canStart !== undefined && { canStart }),
	}) as any;

/** Lets the window's own follow-up reads happen, so a count taken after it is the count of the whole opening. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 100)));

type Answer = (callId: string) => unknown;

const renderAt = (ui: ReactElement, { answer, queryClient }: { answer: Answer; queryClient?: QueryClient }) => {
	const info = jest.fn(({ callId }: { callId: string }) => {
		const result = answer(callId);
		return result instanceof Promise ? result : Promise.resolve(result);
	});
	const start = jest.fn(async () => ({ data: { type: 'videoconference', callId: 'call-id' }, success: true }) as any);
	const join = jest.fn(async () => ({ url: '', providerName: 'test' }) as any);
	const navigate = jest.fn();
	const notifyRoom: StreamControllerRef<'notify-room'> = {};
	const client = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

	const view = render(ui, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withPermission('videoconf-ring-users')
			.withQueryClient(client)
			.withRouter({ navigate, buildRoutePath: () => '/conference/weekly-sync' })
			.withStream('notify-room', notifyRoom)
			.withStream('video-conference', {})
			.withEndpoint('GET', '/v1/video-conference.info', info as any)
			.withEndpoint('POST', '/v1/video-conference.start', start)
			.withEndpoint('POST', '/v1/video-conference.join', join)
			.withEndpoint('POST', '/v1/video-conference.heartbeat', async () => ({}) as any)
			.build(),
	});

	return {
		...view,
		info,
		start,
		join,
		navigate,
		notifyRoom,
		client,
		readsOf: (id: string) => info.mock.calls.filter(([{ callId }]) => callId === id).length,
	};
};

beforeEach(() => {
	mockWindowMounted.mockClear();
	mockWindowRendered.mockClear();
	window.history.replaceState({}, '', '/conference/weekly-sync');
});

describe('a conference address', () => {
	const answerLive: Answer = (callId) => {
		if (callId === 'call-id' || callId === 'weekly-sync') {
			return liveConference;
		}
		return Promise.reject({ success: false, error: 'invalid-params' });
	};

	// Every call window used to open this way; the gate in front of it must not cost a request.
	it('opens a plain call id with the same info requests as the window on its own', async () => {
		const { readsOf: readsOfBase, unmount: unmountBase } = renderAt(
			<ConferenceProvider callId='call-id'>
				<ConferenceWindow />
			</ConferenceProvider>,
			{ answer: answerLive },
		);
		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		await settle();
		const baseReads = readsOfBase('call-id');
		unmountBase();

		const view = renderAt(<ConferenceLinkGate segment='call-id' />, { answer: answerLive });
		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		await settle();

		expect(baseReads).toBeGreaterThan(0);
		expect(view.readsOf('call-id')).toBe(baseReads);
		expect(view.info).toHaveBeenCalledTimes(baseReads);
	});

	it('opens a link with a live conference as that conference', async () => {
		renderAt(<ConferenceLinkGate segment='weekly-sync' />, { answer: answerLive });

		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		// Started from the answer already read: the window never showed a loading state of its own.
		expect(mockWindowRendered).not.toHaveBeenCalledWith('loading');
		expect(mockWindowMounted).toHaveBeenCalledTimes(1);
	});

	it('reads a link address once, like a call id', async () => {
		const { info: baseInfo, unmount: unmountBase } = renderAt(
			<ConferenceProvider callId='call-id'>
				<ConferenceWindow />
			</ConferenceProvider>,
			{ answer: answerLive },
		);
		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		await settle();
		const baseReads = baseInfo.mock.calls.length;
		unmountBase();

		const view = renderAt(<ConferenceLinkGate segment='weekly-sync' />, { answer: answerLive });
		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		await settle();

		expect(view.readsOf('weekly-sync')).toBe(1);
		expect(view.info).toHaveBeenCalledTimes(baseReads);
	});

	it("holds the info under the conference's real id", async () => {
		const { client } = renderAt(<ConferenceLinkGate segment='weekly-sync' />, { answer: answerLive });

		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();

		expect(client.getQueryData(videoConferenceInfoQueryKey('call-id'))).toMatchObject({ _id: 'call-id', customUrl: 'weekly-sync' });
	});

	it('shows the page of a link with nothing live', async () => {
		const { join } = renderAt(<ConferenceLinkGate segment='weekly-sync' />, { answer: () => notStarted(false) });

		expect(await screen.findByText('Conference_not_started_yet')).toBeInTheDocument();
		expect(screen.queryByText(/^window for/)).not.toBeInTheDocument();
		expect(join).not.toHaveBeenCalled();
	});

	it('shows the loading page until the address is resolved', async () => {
		renderAt(<ConferenceLinkGate segment='weekly-sync' />, { answer: () => new Promise(() => undefined) });

		expect(await screen.findByRole('alert', { name: 'loading' })).toBeInTheDocument();
		expect(screen.queryByText(/^window for/)).not.toBeInTheDocument();
		expect(screen.queryByText('Conference_not_started_yet')).not.toBeInTheDocument();
	});
});

describe('an address that cannot be opened', () => {
	const fastRetries = () => new QueryClient({ defaultOptions: { queries: { retryDelay: 1 }, mutations: { retry: false } } });

	it('shows the unauthorized page for an address that is refused, after one request', async () => {
		const { info } = renderAt(<ConferenceLinkGate segment='nothing-here' />, {
			answer: () => Promise.reject({ success: false, error: 'invalid-params' }),
			queryClient: fastRetries(),
		});

		expect(await screen.findByText('You_are_not_authorized_to_view_this_page')).toBeInTheDocument();
		await settle();
		expect(info).toHaveBeenCalledTimes(1);
	});

	// A request that never arrived says nothing about the address, so it is not answered with "unauthorized".
	it('retries a request that never arrived, then offers Retry', async () => {
		const { info } = renderAt(<ConferenceLinkGate segment='weekly-sync' />, {
			answer: () => Promise.reject(new Error('network down')),
			queryClient: fastRetries(),
		});

		expect(await screen.findByText('Something_went_wrong')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
		expect(screen.queryByText('You_are_not_authorized_to_view_this_page')).not.toBeInTheDocument();
		expect(info).toHaveBeenCalledTimes(3);
	});

	it('Retry reads the address again', async () => {
		let online = false;
		renderAt(<ConferenceLinkGate segment='weekly-sync' />, {
			answer: () => (online ? notStarted(false) : Promise.reject(new Error('network down'))),
			queryClient: fastRetries(),
		});

		const retry = await screen.findByRole('button', { name: 'Retry' });
		online = true;
		await userEvent.click(retry);

		expect(await screen.findByText('Conference_not_started_yet')).toBeInTheDocument();
	});
});

describe('a link whose conference starts', () => {
	it('turns the not-started page into the call when the link goes live', async () => {
		let live = false;
		const { notifyRoom, readsOf } = renderAt(<ConferenceLinkGate segment='weekly-sync' />, {
			answer: (callId) => (live || callId === 'call-id' ? liveConference : notStarted(false)),
		});

		expect(await screen.findByText('Conference_not_started_yet')).toBeInTheDocument();

		live = true;
		act(() => notifyRoom.controller?.emit('room-id/videoconf', ['call-id']));

		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		expect(screen.queryByText('Conference_not_started_yet')).not.toBeInTheDocument();
		expect(readsOf('weekly-sync')).toBe(2);
	});

	it('renders the call the page started, in place', async () => {
		const { start, join } = renderAt(<ConferenceLinkGate segment='weekly-sync' />, {
			answer: (callId) => (callId === 'call-id' ? liveConference : notStarted(true)),
		});

		await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));

		expect(await screen.findByText(/^window for call-id/)).toBeInTheDocument();
		expect(start).toHaveBeenCalledTimes(1);
		expect(join).toHaveBeenCalledTimes(1);
	});

	// The link answers the live conference once anything reads it again after the start, reconnecting included.
	it('does not remount the call when the link then turns live', async () => {
		let live = false;
		const view = renderAt(<ConferenceLinkGate segment='weekly-sync' />, {
			answer: (callId) => (live || callId === 'call-id' ? liveConference : notStarted(true)),
		});

		await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));
		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();

		live = true;
		await act(() => view.client.invalidateQueries({ queryKey: videoConferenceInfoQueryKey('weekly-sync') }));
		await settle();

		expect(view.readsOf('weekly-sync')).toBe(2);
		expect(screen.getByText('window for call-id, loaded')).toBeInTheDocument();
		expect(mockWindowMounted).toHaveBeenCalledTimes(1);
		expect(view.join).toHaveBeenCalledTimes(1);
	});

	it('never navigates while opening, starting and being in the call', async () => {
		const { navigate } = renderAt(<ConferenceLinkGate segment='weekly-sync' />, {
			answer: (callId) => (callId === 'call-id' ? liveConference : notStarted(true)),
		});

		await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));
		expect(await screen.findByText('window for call-id, loaded')).toBeInTheDocument();
		await settle();

		expect(navigate).not.toHaveBeenCalled();
		expect(window.location.pathname).toBe('/conference/weekly-sync');
	});
});
