import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OngoingCalls from './OngoingCalls';
import { buildJoinableCall as call } from '../../views/conference/testFixtures';

const joinCall = jest.fn();
const dismissCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
	useVideoConfDismissCall: () => dismissCall,
}));

const decline = jest.fn(() => ({ success: true }) as any);

const renderSection = (calls: JoinableVideoConference[]) =>
	render(<OngoingCalls />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			// `createdAt` is a string over REST; the fixtures carry Dates, which is what the hook hands on.
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.decline', decline)
			.build(),
	});

beforeEach(() => {
	joinCall.mockClear();
	dismissCall.mockClear();
	decline.mockClear();
});

it('renders nothing when there are no joinable calls', async () => {
	const { container } = renderSection([]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('lists several calls at once', async () => {
	renderSection([call({ callId: 'call-a' }), call({ callId: 'call-b' }), call({ callId: 'call-c' })]);

	expect(await screen.findByText('Call call-a')).toBeInTheDocument();
	expect(screen.getByText('Call call-b')).toBeInTheDocument();
	expect(screen.getByText('Call call-c')).toBeInTheDocument();
});

// Declining is a settled decision: it quiets the sidebar, and the call history is the way back to it.
it('hides a call this user has declined', async () => {
	renderSection([call({ callId: 'kept' }), call({ callId: 'dropped', declined: true })]);

	expect(await screen.findByText('Call kept')).toBeInTheDocument();
	expect(screen.queryByText('Call dropped')).not.toBeInTheDocument();
});

it('joins the right call', async () => {
	renderSection([call({ callId: 'joinable' })]);

	await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

	expect(joinCall).toHaveBeenCalledWith('joinable');
});

it('declines the right call', async () => {
	renderSection([call({ callId: 'declinable' })]);

	await userEvent.click(await screen.findByRole('button', { name: 'Decline' }));

	await waitFor(() => expect(decline).toHaveBeenCalledWith({ callId: 'declinable' }));
});

// Offering to join a call the user is already in would be a no-op, so the row marks presence instead.
// Every row here is something to act on. The call the reader is in offers nothing to reach — a row that only
// said "in call" left them with something they could not do anything about.
it('leaves out the call the user is already in', async () => {
	const { container } = renderSection([call({ callId: 'here', joined: true })]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('gives every row it does show both actions', async () => {
	renderSection([call({ callId: 'one' }), call({ callId: 'two' })]);

	expect(await screen.findAllByRole('button', { name: 'Join' })).toHaveLength(2);
	expect(screen.getAllByRole('button', { name: 'Decline' })).toHaveLength(2);
});

describe('when there are more than a few', () => {
	const many = [
		call({ callId: 'oldest', createdAt: new Date('2026-08-03T10:00:00.000Z') }),
		call({ callId: 'middle', createdAt: new Date('2026-08-03T11:00:00.000Z') }),
		call({ callId: 'newer', createdAt: new Date('2026-08-03T12:00:00.000Z') }),
		call({ callId: 'newest', createdAt: new Date('2026-08-03T13:00:00.000Z') }),
	];

	// The sidebar is a route to a call, not a place to read a list, so it shows the most recent few and asks.
	it('shows the three most recent, newest first', async () => {
		renderSection(many);

		expect(await screen.findByText('Call newest')).toBeInTheDocument();
		expect(screen.getByText('Call newer')).toBeInTheDocument();
		expect(screen.getByText('Call middle')).toBeInTheDocument();
		expect(screen.queryByText('Call oldest')).not.toBeInTheDocument();
	});

	it('shows the rest when asked, and folds them away again', async () => {
		renderSection(many);

		await userEvent.click(await screen.findByRole('button', { name: /Show_all__count__calls/ }));
		expect(screen.getByText('Call oldest')).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Show_fewer' }));
		expect(screen.queryByText('Call oldest')).not.toBeInTheDocument();
	});

	it('does not ask when everything already fits', async () => {
		renderSection(many.slice(-3));

		expect(await screen.findByText('Call newest')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Show_all__count__calls/ })).not.toBeInTheDocument();
	});
});

// A call ringing now is being *asked* of the user, so it sits above the rest with its answer on offer — which is
// what replaced the popup that used to take over the screen.
describe('a call that is ringing', () => {
	const ringing = (overrides: Partial<JoinableVideoConference> = {}) =>
		call({ callId: 'ringing', name: 'Alice', ringingAt: new Date(), ...overrides });

	it('offers an answer instead of a join', async () => {
		renderSection([ringing()]);

		expect(await screen.findByRole('button', { name: 'Accept' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
	});

	// Said once, above the group — the item itself has the same thing to say as the calls below: who is in there.
	it('says it is an incoming call, above the item', async () => {
		renderSection([ringing()]);

		expect(await screen.findByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Incoming_call')).toBeInTheDocument();
		expect(screen.getByTitle('__count__people_in_the_call')).toBeInTheDocument();
	});

	it('says how many are incoming when there is more than one', async () => {
		renderSection([ringing(), ringing({ callId: 'ringing-two', name: 'Bob' })]);

		expect(await screen.findByText('Incoming_calls')).toBeInTheDocument();
		expect(screen.queryByText('Incoming_call')).not.toBeInTheDocument();
	});

	it('joins the call when answered', async () => {
		renderSection([ringing()]);

		await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));

		expect(joinCall).toHaveBeenCalledWith('ringing');
	});

	it('turns it down when declined', async () => {
		renderSection([ringing()]);

		await userEvent.click(await screen.findByRole('button', { name: 'Decline' }));

		await waitFor(() => expect(decline).toHaveBeenCalledWith({ callId: 'ringing' }));
	});

	// Above the others, because it is the only one asking a question.
	it('comes before the calls that are simply running', async () => {
		renderSection([call({ callId: 'older', name: 'Standup' }), ringing()]);

		const items = await screen.findAllByText(/Alice|Standup/);
		expect(items.map((item) => item.textContent)).toEqual(['Alice', 'Standup']);
	});

	// A ring stops being a ring on its own, with nothing to announce it: the call is still there, it just isn't
	// asking any more.
	it('becomes an ordinary call once the ring has stopped', async () => {
		renderSection([ringing({ ringingAt: new Date(Date.now() - 60_000) })]);

		expect(await screen.findByRole('button', { name: 'Join' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
	});
});

// Silencing is not answering: the ring stops so the user can decide in their own time, and the call stays where
// it is.
describe('silencing a ringing call', () => {
	const withRinging = () =>
		render(<OngoingCalls />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint(
					'GET',
					'/v1/video-conference.joinable',
					() => ({ calls: [call({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })], success: true }) as any,
				)
				.withEndpoint('POST', '/v1/video-conference.decline', decline)
				.withIncomingCalls([{ callId: 'ringing', uid: 'caller', rid: 'room-id' } as any])
				.build(),
		});

	it('offers to stop the sound', async () => {
		withRinging();

		await userEvent.click(await screen.findByRole('button', { name: 'Silence' }));

		expect(dismissCall).toHaveBeenCalledWith('ringing');
	});

	// Silenced, not answered: it is still an incoming call, still offering both answers.
	it('keeps the call and its answers after silencing', async () => {
		withRinging();

		await userEvent.click(await screen.findByRole('button', { name: 'Silence' }));

		expect(screen.getByTitle('Incoming_call_silenced')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
	});

	it('has nothing left to silence afterwards', async () => {
		withRinging();

		await userEvent.click(await screen.findByRole('button', { name: 'Silence' }));

		expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	});

	// A ring this client never heard — a reload, or a call rung before the page loaded — has no sound to stop.
	it('offers nothing when there is no sound playing here', async () => {
		render(<OngoingCalls />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withEndpoint(
					'GET',
					'/v1/video-conference.joinable',
					() => ({ calls: [call({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })], success: true }) as any,
				)
				.build(),
		});

		expect(await screen.findByText('Incoming_call')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	});
});

// The list can outgrow the space it is docked in, so it scrolls rather than pushing everything below it away.
it('scrolls rather than growing without end', async () => {
	const many = Array.from({ length: 12 }, (_, index) => call({ callId: `call-${index}` }));
	const { container } = renderSection(many);

	expect(await screen.findByText('Call call-0')).toBeInTheDocument();

	const scroller = container.querySelector('[class*="rcx-box"]');
	expect(scroller && getComputedStyle(scroller).overflowY).toBe('auto');
});

// …and the way to see the rest stays reachable, outside whatever is scrolling.
it('keeps the toggle out of the scrolling part', async () => {
	const many = Array.from({ length: 12 }, (_, index) => call({ callId: `call-${index}` }));
	const { container } = renderSection(many);

	const toggle = await screen.findByRole('button', { name: /Show_all__count__calls/ });
	const scroller = container.querySelector('[class*="rcx-box"]');

	expect(scroller?.contains(toggle)).toBe(false);
});
