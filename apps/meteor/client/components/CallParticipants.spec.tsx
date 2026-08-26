import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CallParticipants from './CallParticipants';

const person = (username: string) => ({ _id: username, username });

const renderParticipants = (props: Parameters<typeof CallParticipants>[0], avatars = true) =>
	render(<CallParticipants {...props} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', avatars).build(),
	});

// Faces say *who* is in the call, which is usually what decides whether to join. The count alone never did.
it('shows a face for each of the people it was given', () => {
	const { container } = renderParticipants({ people: [person('alice'), person('bob')], total: 2 });

	expect(container.querySelectorAll('img')).toHaveLength(2);
});

// Said the way the call's own message block says it, so a call reads the same in the sidebar as in its room.
it('follows the faces with how many more there are', () => {
	renderParticipants({ people: [person('alice'), person('bob'), person('carol')], total: 12 });

	expect(screen.getByText('plus__usersCount__joined')).toBeInTheDocument();
});

it('says just "joined" when every one of them is shown', () => {
	renderParticipants({ people: [person('alice'), person('bob')], total: 2 });

	expect(screen.getByText('joined')).toBeInTheDocument();
	expect(screen.queryByText('plus__usersCount__joined')).not.toBeInTheDocument();
});

it('still says how many there are, for anyone who cannot see the faces', () => {
	renderParticipants({ people: [person('alice')], total: 4 });

	expect(screen.getByTitle('__count__people_in_the_call')).toBeInTheDocument();
});

// A single face reads as a mistake rather than as a call, so an empty second place stands beside it — decorative,
// which is why it is hidden from anyone listening rather than looking.
it('gives a lone face an empty place beside it', () => {
	const { container } = renderParticipants({ people: [person('alice')], total: 1 });

	expect(container.querySelectorAll('img')).toHaveLength(1);
	expect(container.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(1);
});

it('leaves the empty place out once there are two', () => {
	const { container } = renderParticipants({ people: [person('alice'), person('bob')], total: 2 });

	expect(container.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(0);
});

// Side by side rather than overlapped, so nothing has to be stacked and no face is half hidden behind another.
it('sets the faces beside each other', () => {
	const people = [person('alice'), person('bob'), person('carol')];
	const { container } = renderParticipants({ people, total: 3 });

	expect(container.querySelectorAll('img')).toHaveLength(people.length);
	expect(container.querySelector('[style*="z-index"]')).toBeNull();
});

// An older server, or a call whose members did not travel with it.
it('falls back to the number when there are no faces to show', () => {
	const { container } = renderParticipants({ people: [], total: 3 });

	expect(screen.getByText('__usersCount__joined')).toBeInTheDocument();
	expect(container.querySelectorAll('img')).toHaveLength(0);
});

// Avatars are a preference, and the message block honours it by saying the count in words instead.
it('says it in words when the reader has avatars turned off', () => {
	const { container } = renderParticipants({ people: [person('alice'), person('bob')], total: 5 }, false);

	expect(screen.getByText('__usersCount__joined')).toBeInTheDocument();
	expect(container.querySelectorAll('img')).toHaveLength(0);
});
