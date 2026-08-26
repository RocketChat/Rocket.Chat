import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RingingCallItem from './RingingCallItem';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onAccept = jest.fn();
const onReject = jest.fn();
const onSilence = jest.fn();

let incomingCalls: { callId: string; dismissed: boolean }[] = [];

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfIncomingCalls: () => incomingCalls,
}));

const renderItem = (silenced = false) =>
	render(
		<RingingCallItem
			call={buildJoinableCall({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })}
			silenced={silenced}
			onAccept={onAccept}
			onReject={onReject}
			onSilence={onSilence}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build() },
	);

beforeEach(() => {
	onAccept.mockClear();
	onReject.mockClear();
	onSilence.mockClear();
	incomingCalls = [{ callId: 'ringing', dismissed: false }];
});

it('accepts when the row is clicked', async () => {
	renderItem();

	await userEvent.click(screen.getByText('Alice'));

	expect(onAccept).toHaveBeenCalledWith('ringing');
});

it('offers both silence and decline while it is still sounding', async () => {
	renderItem();

	expect(screen.getByRole('button', { name: 'Silence' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Silence' }));

	expect(onSilence).toHaveBeenCalledWith('ringing');
	expect(onAccept).not.toHaveBeenCalled();
	expect(onReject).not.toHaveBeenCalled();
});

it('replaces silence with a silenced icon once muted, keeping decline', async () => {
	renderItem(true);

	expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	expect(screen.getByTitle('Incoming_call_silenced')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

	expect(onReject).toHaveBeenCalledWith('ringing');
});

it('keeps both buttons at the end of the row', () => {
	const { container } = renderItem();
	const buttons = [...container.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'));

	expect(buttons).toEqual(['Silence', 'Decline']);
});

it('says it is ringing where the time would be', () => {
	renderItem();

	expect(screen.getByText(/Ringing/)).toBeInTheDocument();
});

it('offers the decline straight away for a ring it never heard', () => {
	incomingCalls = [];

	renderItem();

	expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
});
