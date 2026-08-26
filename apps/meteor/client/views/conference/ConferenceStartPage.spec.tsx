import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConferenceStartPage from './ConferenceStartPage';

const start = jest.fn(() => ({ data: { type: 'videoconference', callId: 'new-call' }, success: true }) as any);
const join = jest.fn(() => ({ url: 'https://call.example', providerName: 'test' }) as any);
const navigate = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouter: () => ({ navigate, buildRoutePath: () => '/conference/new-call' }),
}));

const subscription = (t: 'c' | 'd') => ({
	subscription: { _id: 'sub', rid: 'room-id', t, fname: 'general', name: 'general' },
	success: true,
});

const renderStart = (t: 'c' | 'd' = 'c') =>
	render(<ConferenceStartPage rid='room-id' />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/subscriptions.getOne', () => subscription(t) as any)
			.withEndpoint(
				'GET',
				'/v1/video-conference.capabilities',
				() => ({ providerName: 'test', capabilities: { mic: true, cam: true } }) as any,
			)
			.withEndpoint('POST', '/v1/video-conference.start', start)
			.withEndpoint('POST', '/v1/video-conference.join', join)
			.build(),
	});

beforeEach(() => {
	start.mockClear();
	join.mockClear();
	navigate.mockClear();
	localStorage.clear();
});

// The reported problem: clicking *call* in a room posted a message there and rang people for a call that hadn't
// happened yet. Opening this window must create nothing at all.
it('creates no conference until it is asked to', async () => {
	renderStart();

	expect(await screen.findByRole('button', { name: 'Start_call' })).toBeInTheDocument();
	expect(start).not.toHaveBeenCalled();
	expect(join).not.toHaveBeenCalled();
});

// Offered as the meeting it is, rather than as the room's bare name.
it('names the call after the room it is being started in', async () => {
	renderStart();

	expect(await screen.findByLabelText('Call_name')).toHaveValue('Meeting_in__roomName__');
});

it('starts the conference with the name and devices it was given', async () => {
	renderStart();

	await userEvent.clear(await screen.findByLabelText('Call_name'));
	await userEvent.type(screen.getByLabelText('Call_name'), 'Release planning');
	await userEvent.click(screen.getByRole('button', { name: 'Mic_on' }));
	await userEvent.click(screen.getByRole('button', { name: 'Start_call' }));

	await waitFor(() => expect(start).toHaveBeenCalledWith({ roomId: 'room-id', title: 'Release planning', allowRinging: true }));
	await waitFor(() => expect(join).toHaveBeenCalledWith({ callId: 'new-call', state: { mic: false, cam: false } }));
});

// Replacing this screen is what stops a reload starting a second conference, and what lets the window be reached
// again as the call it now holds.
it('becomes the conference it started', async () => {
	renderStart();

	await userEvent.click(await screen.findByRole('button', { name: 'Start_call' }));

	await waitFor(() => expect(navigate).toHaveBeenCalledWith({ name: 'conference', params: { id: 'new-call' } }, { replace: true }));
});

// A direct call is placed to someone: it is their name on the button, and it has no name of its own to set.
it('offers to call the person in a direct message', async () => {
	renderStart('d');

	expect(await screen.findByRole('button', { name: 'Call__name__' })).toBeInTheDocument();
	expect(screen.queryByLabelText('Call_name')).not.toBeInTheDocument();
});
