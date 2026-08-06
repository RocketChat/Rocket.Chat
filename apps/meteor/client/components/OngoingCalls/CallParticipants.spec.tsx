import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CallParticipants from './CallParticipants';

const participant = (username: string) => ({ _id: username, username, name: username });

const renderParticipants = (props: Parameters<typeof CallParticipants>[0]) =>
	render(<CallParticipants {...props} />, { wrapper: mockAppRoot().withJohnDoe().build() });

// Faces say *who* is in the call, which is usually what decides whether to join. The count alone never did.
it('shows a face for each of the participants it was given', () => {
	const { container } = renderParticipants({ participants: [participant('alice'), participant('bob')], usersCount: 2 });

	expect(container.querySelectorAll('img')).toHaveLength(2);
	expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
});

// The server sends a few and the whole count, so what is left over is a number at the end.
it('counts off the ones it has no room for', () => {
	renderParticipants({ participants: [participant('alice'), participant('bob'), participant('carol')], usersCount: 12 });

	expect(screen.getByText('+9')).toBeInTheDocument();
});

it('still says how many there are, for anyone who cannot see the faces', () => {
	renderParticipants({ participants: [participant('alice')], usersCount: 4 });

	expect(screen.getByTitle('__count__people_in_the_call')).toBeInTheDocument();
});

// An older server, or a call whose members did not travel with it.
it('falls back to the number when there are no faces to show', () => {
	const { container } = renderParticipants({ participants: [], usersCount: 3 });

	expect(screen.getByText('__count__people_in_the_call')).toBeInTheDocument();
	expect(container.querySelectorAll('img')).toHaveLength(0);
});

// A number tucked under an avatar is a number you have to guess at.
it('puts the count beside the faces, not under them', () => {
	renderParticipants({ participants: [participant('alice'), participant('bob'), participant('carol')], usersCount: 6 });

	const counter = screen.getByText('+3');
	expect(counter).toBeInTheDocument();
	expect(Number.parseInt(getComputedStyle(counter).marginInlineStart || '0', 10)).toBeGreaterThanOrEqual(0);
});
