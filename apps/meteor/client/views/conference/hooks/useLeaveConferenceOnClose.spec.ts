import { act, renderHook } from '@testing-library/react';

import { departureFor, useLeaveConferenceOnClose } from './useLeaveConferenceOnClose';
import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';

const credentials = { 'X-User-Id': 'uid-1', 'X-Auth-Token': 'token-1' };

// jsdom has no `Response`, and the hook only ever awaits the promise.
const fetchMock = jest.fn(() => Promise.resolve({} as Response));

beforeEach(() => {
	fetchMock.mockClear();
	global.fetch = fetchMock as unknown as typeof fetch;
	jest.spyOn(APIClient, 'getCredentials').mockReturnValue(credentials);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const hide = () => window.dispatchEvent(new Event('pagehide'));

it('reports the user leaving when the call window goes away', () => {
	renderHook(() => useLeaveConferenceOnClose('call-1'));

	hide();

	expect(fetchMock).toHaveBeenCalledTimes(1);
	const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
	expect(url).toContain('/api/v1/video-conference.leave');
	expect(init.method).toBe('POST');
	expect(JSON.parse(init.body as string)).toEqual({ callId: 'call-1' });
	expect(init.headers).toMatchObject(credentials);
});

// The document is being torn down, so a request without `keepalive` is cancelled with the page — which is the
// whole failure this hook exists to avoid.
it('sends the request with keepalive, since the page is going away', () => {
	renderHook(() => useLeaveConferenceOnClose('call-1'));

	hide();

	expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].keepalive).toBe(true);
});

it('says nothing when there are no credentials to say it with', () => {
	jest.spyOn(APIClient, 'getCredentials').mockReturnValue(undefined);

	renderHook(() => useLeaveConferenceOnClose('call-1'));

	hide();

	expect(fetchMock).not.toHaveBeenCalled();
});

it('stops reporting once the page is no longer showing a conference', () => {
	const { unmount } = renderHook(() => useLeaveConferenceOnClose('call-1'));

	unmount();
	hide();

	expect(fetchMock).not.toHaveBeenCalled();
});

describe('leaving on purpose', () => {
	// The user who picks "leave" rather than closing the window should not have to close it themselves.
	it('reports leaving and then closes the window', async () => {
		const close = jest.spyOn(window, 'close').mockImplementation(() => undefined);

		const { result } = renderHook(() => useLeaveConferenceOnClose('call-1'));

		await act(() => result.current.leaveNow());

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String((fetchMock.mock.calls[0] as unknown as [string])[0])).toContain('/api/v1/video-conference.leave');
		expect(close).toHaveBeenCalled();
	});

	// Closing the window is what `pagehide` fires for, so the deliberate leave and the close it causes are one
	// departure — reported twice, the server broadcasts the same update to everyone still in the call twice.
	it('does not report the same departure again when closing fires pagehide', async () => {
		jest.spyOn(window, 'close').mockImplementation(() => undefined);

		const { result } = renderHook(() => useLeaveConferenceOnClose('call-1'));

		await act(() => result.current.leaveNow());
		hide();

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe('what gets reported', () => {
	const urlOf = (call: number) => String((fetchMock.mock.calls[call] as unknown as [string])[0]);

	// A call nobody has joined yet has nobody `isInVideoConference`, so reporting a leave from its preflight
	// schedules the empty-call sweep — ending the call for the people still on their way into it.
	it('says nothing for a member who was never asked and never arrived', () => {
		renderHook(() => useLeaveConferenceOnClose('call-1', 'none'));

		hide();

		expect(fetchMock).not.toHaveBeenCalled();
	});

	// Abandoning the preflight of a call you are placing is cancelling it, ring included — which is what the
	// endpoint has meant since long before this window existed.
	it('cancels for the caller who leaves before the call is answered', () => {
		renderHook(() => useLeaveConferenceOnClose('call-1', 'cancel'));

		hide();

		expect(urlOf(0)).toContain('/api/v1/video-conference.cancel');
	});

	it('declines for a member who was rung and closed it', () => {
		renderHook(() => useLeaveConferenceOnClose('call-1', 'decline'));

		hide();

		expect(urlOf(0)).toContain('/api/v1/video-conference.decline');
	});

	// The guard is against reporting the *same* thing twice, not against a member whose standing changed:
	// declining from the preflight and then joining anyway still owes the call a leave.
	it('reports a leave after a decline, since they are different departures', async () => {
		// `leaveNow` closes the window, and jsdom's own `close` tears the document down under the test.
		jest.spyOn(window, 'close').mockImplementation(() => undefined);

		let departure: 'decline' | 'leave' = 'decline';
		const { result, rerender } = renderHook(() => useLeaveConferenceOnClose('call-1', departure));

		hide();
		departure = 'leave';
		rerender();
		await act(() => result.current.leaveNow());

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(urlOf(0)).toContain('.decline');
		expect(urlOf(1)).toContain('.leave');
	});
});

// The rule itself, away from the window: what a departure *means* depends on how far its user got, and getting
// this wrong is not a cosmetic matter — reporting a leave for someone who never joined ends the call for the
// people still arriving, because a call nobody has joined has nobody the empty-call check can count.
describe('what a departure means', () => {
	const caller = { joined: false, isDirect: true, isCreator: true, wasRung: false };
	const callee = { joined: false, isDirect: true, isCreator: false, wasRung: true };
	const onlooker = { joined: false, isDirect: false, isCreator: false, wasRung: false };

	it('is leaving, for anyone who joined', () => {
		expect(departureFor({ ...caller, joined: true })).toBe('leave');
		expect(departureFor({ ...callee, joined: true })).toBe('leave');
		expect(departureFor({ ...onlooker, joined: true })).toBe('leave');
	});

	// Abandoning the preflight of a call you are placing is cancelling it. `video-conference.cancel` stops the
	// ring, which waiting for an empty-call sweep does not.
	it('is cancelling, for the caller of an unanswered direct call', () => {
		expect(departureFor(caller)).toBe('cancel');
	});

	it('is declining, for a member who was rung and did not join', () => {
		expect(departureFor(callee)).toBe('decline');
	});

	// The case that made this a bug: a member who opened a group call's window of their own accord and closed it
	// again. They were not asked and they did not arrive, so there is nothing about them to report — and saying
	// they left would end a call whose creator was still in their own preflight.
	it('is nothing at all, for a member who was never asked and never arrived', () => {
		expect(departureFor(onlooker)).toBe('none');
		expect(departureFor({ ...onlooker, isDirect: true })).toBe('none');
	});

	// Creating a group call is not placing a direct one: there is no ring to cancel, and cancelling is a direct
	// call's own endpoint.
	it('is nothing for the creator of a group call, who has no ring to cancel', () => {
		expect(departureFor({ joined: false, isDirect: false, isCreator: true, wasRung: false })).toBe('none');
	});
});
