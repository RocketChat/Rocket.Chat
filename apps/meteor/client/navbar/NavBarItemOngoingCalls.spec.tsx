import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarItemOngoingCalls from './NavBarItemOngoingCalls';

const joinCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
}));

let sidebarCollapsed = true;

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useLayout: () => ({ sidebar: { isCollapsed: sidebarCollapsed } }),
}));

const call = (overrides: Partial<JoinableVideoConference> & Pick<JoinableVideoConference, 'callId'>): JoinableVideoConference => ({
	name: `Call ${overrides.callId}`,
	createdAt: new Date(),
	usersCount: 2,
	participants: [{ _id: 'someone', username: 'someone', name: 'Someone' }],
	joined: false,
	declined: false,
	...overrides,
});

const renderButton = (calls: JoinableVideoConference[]) =>
	render(<NavBarItemOngoingCalls />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.decline', () => ({ success: true }) as any)
			.build(),
	});

beforeEach(() => {
	joinCall.mockClear();
	sidebarCollapsed = true;
});

// It stands in for the sidebar's docked list, so with the sidebar on screen there is nothing to stand in for.
it('says nothing while the sidebar is showing the calls itself', async () => {
	sidebarCollapsed = false;
	const { container } = renderButton([call({ callId: 'one' })]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('says nothing when there are no calls to reach', async () => {
	const { container } = renderButton([]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('counts the calls that are running', async () => {
	renderButton([call({ callId: 'one' }), call({ callId: 'two' })]);

	expect(await screen.findByRole('button', { name: /__count__ongoing/ })).toBeInTheDocument();
});

it('opens the same list the sidebar docks', async () => {
	renderButton([call({ callId: 'one', name: 'Standup' })]);

	await userEvent.click(await screen.findByRole('button', { name: /__count__ongoing/ }));

	expect(await screen.findByText('Standup')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
});

// A ringing call the user has to go looking for is a missed call.
describe('when something is ringing', () => {
	const ringing = [call({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })];

	it('says so on the button', async () => {
		renderButton(ringing);

		expect(await screen.findByRole('button', { name: /__count__ringing/ })).toBeInTheDocument();
	});

	it('opens itself without being asked', async () => {
		renderButton(ringing);

		expect(await screen.findByText('Alice')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
	});
});
