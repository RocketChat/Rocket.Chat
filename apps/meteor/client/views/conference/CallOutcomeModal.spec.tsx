import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallOutcomeModal from './CallOutcomeModal';
import type { CallOutcome, ConferenceMember } from './hooks/useCallOutcome';

const callee: ConferenceMember = { _id: 'callee', username: 'callee', name: 'The Callee', joined: false };

const ring = jest.fn(() => ({ rang: ['callee'], success: true }) as any);
const onRang = jest.fn();
const onStay = jest.fn();
const onLeave = jest.fn();

const renderModal = ({ outcome = 'unanswered' as CallOutcome, canRing = true } = {}) =>
	render(
		<CallOutcomeModal
			callId='call-id'
			outcome={outcome}
			others={[callee]}
			canRing={canRing}
			onRang={onRang}
			onStay={onStay}
			onLeave={onLeave}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withEndpoint('POST', '/v1/video-conference.ring', ring).build() },
	);

beforeEach(() => {
	[ring, onRang, onStay, onLeave].forEach((fn) => fn.mockClear());
});

it.each([
	['unanswered' as CallOutcome, 'Nobody_answered_the_call'],
	['declined' as CallOutcome, 'Call_was_declined'],
])('says which way the call went for %s', (outcome, title) => {
	renderModal({ outcome });

	expect(screen.getByText(title)).toBeInTheDocument();
});

it('names who it is about', () => {
	renderModal();

	expect(screen.getByText(callee.username)).toBeInTheDocument();
});

// Closing the window for them would be presumptuous — they may want to wait, or try again — so all three are
// offered and none happens on its own.
it('offers to stay, ring again, or leave', () => {
	renderModal();

	expect(screen.getByRole('button', { name: 'Stay_in_the_call' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Ring_again' })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Leave_call' })).toBeInTheDocument();
});

// Only a direct call rang a particular person; a conference started in a channel rang nobody to ring back.
it('does not offer to ring again where nobody in particular was called', () => {
	renderModal({ canRing: false });

	expect(screen.queryByRole('button', { name: 'Ring_again' })).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Stay_in_the_call' })).toBeInTheDocument();
});

it('rings again through the server, and only then reports it', async () => {
	renderModal();

	await userEvent.click(screen.getByRole('button', { name: 'Ring_again' }));

	await waitFor(() => expect(ring).toHaveBeenCalledWith({ callId: 'call-id' }));
	await waitFor(() => expect(onRang).toHaveBeenCalled());
});

// A failed ring must not restart the wait, or the caller is left believing the phone is ringing again.
it('does not report a ring the server refused', async () => {
	ring.mockImplementationOnce(() => {
		throw new Error('nope');
	});

	renderModal();

	await userEvent.click(screen.getByRole('button', { name: 'Ring_again' }));

	await waitFor(() => expect(ring).toHaveBeenCalled());
	expect(onRang).not.toHaveBeenCalled();
});

it.each([
	['Stay_in_the_call', () => onStay],
	['Leave_call', () => onLeave],
])('hands %s back to the page', async (label, handler) => {
	renderModal();

	await userEvent.click(screen.getByRole('button', { name: label }));

	expect(handler()).toHaveBeenCalled();
});
