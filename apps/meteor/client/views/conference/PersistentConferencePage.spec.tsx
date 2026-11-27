import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PersistentConferencePage from './PersistentConferencePage';
import { closeCallWindow } from './lib/callWindow';

jest.mock('./lib/callWindow', () => ({
	...jest.requireActual('./lib/callWindow'),
	closeCallWindow: jest.fn(),
}));

const navigate = jest.fn();

/**
 * One router for the page, as in the product: `useConfinedNavigation` patches `navigate` on the object it is
 * handed, and the spec reads that same object to see whether the patch is there.
 */
let router: { navigate: typeof navigate; buildRoutePath: (to: unknown) => string };

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: () => router,
}));

const link = ({ canStart, type = 'c' }: { canStart?: boolean; type?: 'c' | 'p' | 'd' } = {}) =>
	({
		_id: 'link-id',
		type: 'videoconference',
		status: 5,
		rid: 'room-id',
		title: 'Weekly sync',
		providerName: 'test',
		createdAt: new Date('2026-11-25T10:00:00.000Z'),
		createdBy: { _id: 'creator', username: 'creator', name: 'Creator' },
		users: [],
		messages: {},
		anonymousUsers: 0,
		conferenceRoomId: 'link-id',
		customUrl: 'weekly-sync',
		capabilities: { mic: true, cam: true },
		chatAccess: { rid: 'room-id', name: 'general', type, membersWithoutAccess: [], canInvite: true },
		...(canStart !== undefined && { canStart }),
	}) as any;

const renderPage = ({
	canStart = true,
	type = 'c',
	canRingUsers = true,
	start = jest.fn(async () => ({ data: { type: 'videoconference', callId: 'call-id' }, success: true }) as any),
	withoutCanStart = false,
}: {
	canStart?: boolean;
	type?: 'c' | 'p' | 'd';
	canRingUsers?: boolean;
	start?: jest.Mock;
	withoutCanStart?: boolean;
} = {}) => {
	const join = jest.fn(async () => ({ url: '', providerName: 'test' }) as any);
	const capabilities = jest.fn(async () => ({ providerName: 'test', capabilities: {} }) as any);
	const getSubscription = jest.fn(async () => ({ subscription: null, success: true }) as any);
	const onStarted = jest.fn();

	const builder = mockAppRoot()
		.withJohnDoe()
		.withEndpoint('POST', '/v1/video-conference.start', start)
		.withEndpoint('POST', '/v1/video-conference.join', join)
		.withEndpoint('GET', '/v1/video-conference.capabilities', capabilities)
		.withEndpoint('GET', '/v1/subscriptions.getOne', getSubscription);

	if (canRingUsers) {
		builder.withPermission('videoconf-ring-users');
	}

	const view = render(
		<PersistentConferencePage
			link={link({ canStart: withoutCanStart ? undefined : canStart, type })}
			segment='weekly-sync'
			onStarted={onStarted}
		/>,
		{ wrapper: builder.build() },
	);

	return { ...view, start, join, capabilities, getSubscription, onStarted };
};

const failingStart = (error: string) => jest.fn(() => Promise.reject({ success: false, error }));

beforeEach(() => {
	router = { navigate, buildRoutePath: () => '/home' };
	navigate.mockClear();
	jest.mocked(closeCallWindow).mockClear();
	localStorage.clear();
});

describe('someone who may start it', () => {
	it('offers to start the conference named after the link, which cannot be renamed', async () => {
		renderPage();

		expect(screen.getByRole('heading', { name: 'Start_a_new_conference' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Start_call' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^Call / })).not.toBeInTheDocument();

		const name = screen.getByLabelText('Call_name');
		expect(name).toHaveValue('Weekly sync');
		expect(name).toHaveAttribute('readonly');
	});

	it('cancelling closes the call window', async () => {
		renderPage();

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(closeCallWindow).toHaveBeenCalledTimes(1);
	});

	// Everything the preflight needs came with the link; opening the page must not start anything either.
	it('asks the server for nothing until the start is confirmed', async () => {
		const { start, join, capabilities, getSubscription } = renderPage();

		expect(await screen.findByRole('button', { name: 'Start_call' })).toBeInTheDocument();

		expect(start).not.toHaveBeenCalled();
		expect(join).not.toHaveBeenCalled();
		expect(capabilities).not.toHaveBeenCalled();
		expect(getSubscription).not.toHaveBeenCalled();
	});

	it('starts the conference of the link and reports it', async () => {
		const { start, join, onStarted } = renderPage();

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		await waitFor(() => expect(onStarted).toHaveBeenCalledTimes(1));
		expect(onStarted).toHaveBeenCalledWith('call-id');
		expect(start).toHaveBeenCalledWith(expect.objectContaining({ roomId: 'room-id', customUrl: 'weekly-sync' }));
		expect(start.mock.calls[0][0].title).toBeUndefined();
		expect(join).toHaveBeenCalledWith({ callId: 'call-id', state: expect.any(Object) });
	});

	// The address of a link is the address of its conference: starting it must not move the window anywhere.
	it('never asks the router to navigate', async () => {
		const { onStarted } = renderPage();

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		await waitFor(() => expect(onStarted).toHaveBeenCalled());
		expect(navigate).not.toHaveBeenCalled();
	});

	it('posts one start however many times it is confirmed', async () => {
		const start = jest.fn(() => new Promise(() => undefined));
		renderPage({ start });

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));
		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));
		await userEvent.type(screen.getByLabelText('Call_name'), '{Enter}');

		expect(start).toHaveBeenCalledTimes(1);
	});

	it('keeps the window on the conference', async () => {
		const open = jest.spyOn(window, 'open').mockImplementation(() => null);
		const { unmount } = renderPage();

		await waitFor(() => expect(router.navigate).not.toBe(navigate));
		router.navigate({ pathname: '/home' });

		expect(open).toHaveBeenCalledWith(expect.stringContaining('/home'), '_blank', 'noopener');
		expect(navigate).not.toHaveBeenCalled();

		unmount();
		expect(router.navigate).toBe(navigate);
		open.mockRestore();
	});
});

describe('ringing', () => {
	it('offers ringing in a direct message to someone who may ring', () => {
		renderPage({ type: 'd' });

		expect(screen.getByRole('checkbox', { name: 'Ring_people' })).toBeInTheDocument();
	});

	it('offers no ringing in a channel', () => {
		renderPage({ type: 'c' });

		expect(screen.queryByRole('checkbox', { name: 'Ring_people' })).not.toBeInTheDocument();
	});

	it('offers no ringing without the permission', () => {
		renderPage({ type: 'd', canRingUsers: false });

		expect(screen.queryByRole('checkbox', { name: 'Ring_people' })).not.toBeInTheDocument();
	});

	it('sends the ringing choice made on the preflight', async () => {
		const { start } = renderPage({ type: 'd' });

		const ring = screen.getByRole('checkbox', { name: 'Ring_people' });
		expect(ring).toBeChecked();
		await userEvent.click(ring);
		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		await waitFor(() => expect(start).toHaveBeenCalledWith(expect.objectContaining({ allowRinging: false })));
	});
});

describe('someone who may not start it', () => {
	it('tells someone who cannot start it that it has not started yet', () => {
		renderPage({ canStart: false });

		expect(screen.getByText('Conference_not_started_yet')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Start_call' })).not.toBeInTheDocument();
	});

	it('treats a missing canStart as not startable', () => {
		renderPage({ withoutCanStart: true });

		expect(screen.getByText('Conference_not_started_yet')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Start_call' })).not.toBeInTheDocument();
	});

	it('Close closes the call window', async () => {
		renderPage({ canStart: false });

		await userEvent.click(screen.getByRole('button', { name: 'Close' }));

		expect(closeCallWindow).toHaveBeenCalledTimes(1);
	});
});

describe('a start that fails', () => {
	it('says why a link cannot be started with this provider', async () => {
		renderPage({ start: failingStart('error-video-conf-links-not-supported') });

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		expect(await screen.findByText('Something_went_wrong')).toBeInTheDocument();
		expect(screen.getByText('error-video-conf-links-not-supported')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
	});

	it('says that the link no longer exists', async () => {
		renderPage({ start: failingStart('error-invalid-conference-room') });

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		expect(await screen.findByText('error-invalid-conference-room')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
	});

	it('offers Retry for any other failure and returns to the preflight', async () => {
		renderPage({ start: failingStart('error-videoconf-unexpected') });

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

		expect(await screen.findByText('Something_went_wrong')).toBeInTheDocument();
		expect(screen.queryByText('error-videoconf-unexpected')).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

		expect(await screen.findByRole('button', { name: 'Start_call' })).toBeInTheDocument();
	});

	it('Close closes the call window after a permanent failure', async () => {
		renderPage({ start: failingStart('error-invalid-conference-room') });

		await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));
		await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

		expect(closeCallWindow).toHaveBeenCalledTimes(1);
	});
});
