import { act, renderHook } from '@testing-library/react';

import { useLeaveConferenceOnClose } from './useLeaveConferenceOnClose';
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
});
