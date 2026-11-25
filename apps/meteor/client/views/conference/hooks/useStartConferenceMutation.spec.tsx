import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useStartConferenceMutation } from './useStartConferenceMutation';
import { videoConferenceQueryKeys } from '../../../lib/queryKeys';

const state = { mic: true, cam: false };
const joined = { url: '', providerName: 'livekit' };

const renderMutation = ({
	customUrl,
	isDirect = false,
	join = jest.fn(async () => joined as any),
	start = jest.fn(async () => ({ data: { type: 'videoconference', callId: 'call-id' }, success: true }) as any),
}: {
	customUrl?: string;
	isDirect?: boolean;
	join?: jest.Mock;
	start?: jest.Mock;
} = {}) => {
	const cancel = jest.fn(async () => null as any);
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	// What the cache held at the moment the start was reported: the window shown next reads the join from there.
	const joinAtReport: unknown[] = [];
	const onStarted = jest.fn((callId: string) => {
		joinAtReport.push(queryClient.getQueryData(videoConferenceQueryKeys.join(callId)));
	});

	const view = renderHook(() => useStartConferenceMutation({ rid: 'room-id', customUrl, isDirect, onStarted }), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withQueryClient(queryClient)
			.withEndpoint('POST', '/v1/video-conference.start', start)
			.withEndpoint('POST', '/v1/video-conference.join', join)
			.withEndpoint('POST', '/v1/video-conference.cancel', cancel)
			.build(),
	});

	return { ...view, start, join, cancel, onStarted, joinAtReport };
};

it('sends the link address with the start', async () => {
	const { result, start, onStarted } = renderMutation({ customUrl: 'weekly-sync' });

	act(() => result.current.start({ state, ring: false }));

	await waitFor(() => expect(onStarted).toHaveBeenCalledWith('call-id'));
	expect(start).toHaveBeenCalledWith({ roomId: 'room-id', title: undefined, allowRinging: false, customUrl: 'weekly-sync' });
});

// A start that is not from a link must look exactly as it did before links existed.
it('sends no customUrl for a start that is not from a link', async () => {
	const { result, start, onStarted } = renderMutation();

	act(() => result.current.start({ state, name: 'Release planning' }));

	await waitFor(() => expect(onStarted).toHaveBeenCalled());
	expect(start.mock.calls[0][0]).toEqual({ roomId: 'room-id', title: 'Release planning', allowRinging: true });
	expect(start.mock.calls[0][0]).not.toHaveProperty('customUrl');
});

it('joins the conference it started with the devices chosen', async () => {
	const { result, join, onStarted } = renderMutation();

	act(() => result.current.start({ state }));

	await waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
	expect(join).toHaveBeenCalledWith({ callId: 'call-id', state });
});

it('hands the join over through the cache before reporting the start', async () => {
	const { result, onStarted, joinAtReport } = renderMutation();

	act(() => result.current.start({ state }));

	await waitFor(() => expect(onStarted).toHaveBeenCalled());
	expect(joinAtReport).toEqual([joined]);
});

describe('a join that fails after the start', () => {
	const failingJoin = () =>
		jest.fn(async () => {
			throw new Error('join failed');
		});

	// A direct call is ringing someone by now; leaving it would ring them into a call nobody is in.
	it('cancels a direct call whose join failed', async () => {
		const { result, cancel } = renderMutation({ isDirect: true, join: failingJoin() });

		act(() => result.current.start({ state }));

		await waitFor(() => expect(result.current.error).toBeTruthy());
		expect(cancel).toHaveBeenCalledWith({ callId: 'call-id' });
	});

	// A link always starts a group conference, which cannot be cancelled.
	it('leaves a group conference whose join failed to the empty-call sweep', async () => {
		const { result, cancel, onStarted } = renderMutation({ customUrl: 'weekly-sync', join: failingJoin() });

		act(() => result.current.start({ state }));

		await waitFor(() => expect(result.current.error).toBeTruthy());
		expect(cancel).not.toHaveBeenCalled();
		expect(onStarted).not.toHaveBeenCalled();
	});
});

it('reports the error of a failed start', async () => {
	const failure = { success: false, error: 'error-invalid-conference-room' };
	const { result, join, onStarted } = renderMutation({
		customUrl: 'weekly-sync',
		start: jest.fn(async () => {
			throw failure;
		}),
	});

	act(() => result.current.start({ state }));

	await waitFor(() => expect(result.current.error).toBe(failure));
	expect(join).not.toHaveBeenCalled();
	expect(onStarted).not.toHaveBeenCalled();

	act(() => result.current.reset());
	await waitFor(() => expect(result.current.error).toBeNull());
});
