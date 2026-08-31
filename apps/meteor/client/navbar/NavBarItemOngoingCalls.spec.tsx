import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarItemOngoingCalls from './NavBarItemOngoingCalls';
import { buildJoinableCall as call } from '../views/conference/testFixtures';

const joinCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
}));

const renderButton = (calls: JoinableVideoConference[]) =>
	render(<NavBarItemOngoingCalls />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('displayAvatars', true)
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.decline', () => ({ success: true }) as any)
			.build(),
	});

beforeEach(() => {
	joinCall.mockClear();
});

it('shows the button when there are calls', async () => {
	renderButton([call({ callId: 'one' })]);

	expect(await screen.findByRole('button', { name: /Ongoing_calls/ })).toBeInTheDocument();
});

it('says nothing when there are no calls to reach', async () => {
	const { container } = renderButton([]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('opens the list on click', async () => {
	renderButton([call({ callId: 'one', name: 'Standup' })]);

	await userEvent.click(await screen.findByRole('button', { name: /Ongoing_calls/ }));

	expect(await screen.findByText('Standup')).toBeInTheDocument();
});

describe('when something is ringing', () => {
	const ringing = [call({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })];

	it('is red', async () => {
		renderButton(ringing);

		expect((await screen.findByRole('button', { name: /Ongoing_calls/ })).className).toMatch(/rcx-button--icon-secondary-danger/);
	});

	it('opens itself without being asked', async () => {
		renderButton(ringing);

		expect(await screen.findByText('Alice')).toBeInTheDocument();
	});
});

it('is blue while something is merely running', async () => {
	renderButton([call({ callId: 'running' })]);

	expect((await screen.findByRole('button', { name: /Ongoing_calls/ })).className).toMatch(/rcx-button--icon-secondary-info/);
});

it('keeps a declined call behind a separator', async () => {
	renderButton([call({ callId: 'one', name: 'Standup' }), call({ callId: 'refused', name: 'Design review', declined: true })]);

	await userEvent.click(await screen.findByRole('button', { name: /Ongoing_calls/ }));

	expect(await screen.findByText('Standup')).toBeInTheDocument();
	expect(screen.getByText('Design review')).toBeInTheDocument();
});

// The list opens into a bare box, so the calls in it were loose rows nothing could scope to.
it('opens a named region holding the calls', async () => {
	renderButton([call({ callId: 'call-1', name: 'Standup' })]);

	await userEvent.click(await screen.findByRole('button', { name: /Ongoing_calls/ }));

	const list = await screen.findByRole('region', { name: 'Ongoing_calls' });

	await waitFor(() => expect(list).toHaveTextContent('Standup'));
});
