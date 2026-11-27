import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useRouter } from '@rocket.chat/ui-contexts';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useStartConference } from './useStartConference';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: jest.fn(() => jest.requireActual('@rocket.chat/ui-contexts').useRouter()),
}));

const subscription = (t: 'c' | 'd') => ({
	subscription: { _id: 'sub', rid: 'room-id', t, fname: t === 'd' ? 'Ada Lovelace' : 'general', name: t === 'd' ? 'ada' : 'general' },
	success: true,
});

const renderStart = ({
	t = 'c',
	canRingUsers = false,
	noSubscription = false,
}: { t?: 'c' | 'd'; canRingUsers?: boolean; noSubscription?: boolean } = {}) => {
	const onStarted = jest.fn();
	const builder = mockAppRoot()
		.withJohnDoe()
		.withEndpoint(
			'GET',
			'/v1/subscriptions.getOne',
			() => (noSubscription ? { subscription: null, success: true } : subscription(t)) as any,
		)
		.withEndpoint(
			'GET',
			'/v1/video-conference.capabilities',
			() => ({ providerName: 'test', capabilities: { mic: true, cam: true } }) as any,
		)
		.withEndpoint(
			'POST',
			'/v1/video-conference.start',
			() => ({ data: { type: 'videoconference', callId: 'new-call' }, success: true }) as any,
		)
		.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'https://call.example', providerName: 'test' }) as any);

	if (canRingUsers) {
		builder.withPermission('videoconf-ring-users');
	}

	return { onStarted, ...renderHook(() => useStartConference('room-id', { onStarted }), { wrapper: builder.build() }) };
};

beforeEach(() => {
	jest.mocked(useRouter).mockClear();
});

// The link page starts a conference and stays where it is; only the caller decides whether the address moves.
it('reports the call it started instead of navigating', async () => {
	const { result, onStarted } = renderStart();

	await waitFor(() => expect(result.current.loading).toBe(false));
	act(() => result.current.start({ state: { mic: true, cam: true }, name: 'Release planning' }));

	await waitFor(() => expect(onStarted).toHaveBeenCalledWith('new-call'));
	expect(useRouter).not.toHaveBeenCalled();
});

it('offers ringing only to someone who may ring in a direct message', async () => {
	const { result: direct } = renderStart({ t: 'd', canRingUsers: true });
	await waitFor(() => expect(direct.current.loading).toBe(false));
	expect(direct.current.canRing).toBe(true);
	expect(direct.current.isDirect).toBe(true);

	const { result: withoutPermission } = renderStart({ t: 'd' });
	await waitFor(() => expect(withoutPermission.current.loading).toBe(false));
	expect(withoutPermission.current.canRing).toBe(false);

	const { result: channel } = renderStart({ t: 'c', canRingUsers: true });
	await waitFor(() => expect(channel.current.loading).toBe(false));
	expect(channel.current.canRing).toBe(false);
});

it('fails when the room has no subscription for this user', async () => {
	const { result } = renderStart({ noSubscription: true });

	await waitFor(() => expect(result.current.loading).toBe(false));
	expect(result.current.error).toBeInstanceOf(Error);
});
