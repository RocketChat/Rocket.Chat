import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OngoingCallsSection from './OngoingCallsSection';

const joinCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
}));

const call = (overrides: Partial<JoinableVideoConference> & Pick<JoinableVideoConference, 'callId'>): JoinableVideoConference => ({
	rid: 'room-id',
	name: `Call ${overrides.callId}`,
	type: 'videoconference',
	createdAt: new Date(),
	usersCount: 2,
	joined: false,
	declined: false,
	...overrides,
});

const decline = jest.fn(() => ({ success: true }) as any);

const renderSection = (calls: JoinableVideoConference[]) =>
	render(<OngoingCallsSection />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			// `createdAt` is a string over REST; the fixtures carry Dates, which is what the hook hands on.
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.decline', decline)
			.build(),
	});

beforeEach(() => {
	joinCall.mockClear();
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
it('does not offer to join a call the user is already in', async () => {
	renderSection([call({ callId: 'here', joined: true })]);

	expect(await screen.findByText('Call here')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
});
