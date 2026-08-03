import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OngoingCallsList from './OngoingCallsList';

const joinCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
}));

const call = (overrides: Partial<JoinableVideoConference> & Pick<JoinableVideoConference, 'callId'>): JoinableVideoConference => ({
	rid: 'room-id',
	name: `Call ${overrides.callId}`,
	type: 'videoconference',
	createdAt: new Date('2026-08-03T10:00:00.000Z'),
	usersCount: 2,
	joined: false,
	declined: false,
	...overrides,
});

const renderList = (calls: JoinableVideoConference[]) =>
	render(<OngoingCallsList />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.build(),
	});

beforeEach(() => {
	joinCall.mockClear();
});

it('renders nothing when no call is running', async () => {
	const { container } = renderList([]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('lists the calls that are running, with how many people are in each', async () => {
	renderList([call({ callId: 'one' }), call({ callId: 'two' })]);

	expect(await screen.findByText('Call one')).toBeInTheDocument();
	expect(screen.getByText('Call two')).toBeInTheDocument();
	expect(screen.getAllByText('__count__people_in_the_call')).toHaveLength(2);
});

// This is the whole point of the section: declining quiets the sidebar, so the history is the only way back.
it('keeps a call the user declined, and says so', async () => {
	renderList([call({ callId: 'declined-one', declined: true })]);

	expect(await screen.findByText('Call declined-one')).toBeInTheDocument();
	expect(screen.getByText('Declined')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
});

it('joins the call it was asked to join', async () => {
	renderList([call({ callId: 'wanted' })]);

	await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

	expect(joinCall).toHaveBeenCalledWith('wanted');
});

// Offering to join a call they are already in is a button that does nothing they need.
it('does not offer to join a call the user is already in', async () => {
	renderList([call({ callId: 'already-in', joined: true })]);

	expect(await screen.findByText('Call already-in')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
});
