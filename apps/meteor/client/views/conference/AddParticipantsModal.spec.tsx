import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AddParticipantsModal from './AddParticipantsModal';
import { createFakeRoom } from '../../../tests/mocks/data';
import { Rooms } from '../../stores';

// The mocked app root leaves its toast provider commented out, so what the modal reports has to be observed
// at the dispatch instead of in the DOM.
const dispatchToastMessage = jest.fn();
jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useToastMessageDispatch: () => dispatchToastMessage,
}));

const outsider = { _id: 'outsider-id', username: 'outsider', name: 'Outsider Person', nickname: '', status: 'online', avatarETag: '' };
const memberUser = { _id: 'member-id', username: 'member', name: 'Room Member', nickname: '', status: 'online', avatarETag: '' };

const autocomplete = jest.fn((_params: { selector: string }) => ({ items: [outsider, memberUser] }) as any);
const channelMembers = jest.fn(() => ({ members: [{ _id: 'member-id', username: 'member' }] }) as any);
const addParticipants = jest.fn(() => ({ added: [outsider._id], success: true }) as any);

const renderModal = (props: Partial<{ callId: string; rid: string }> = {}) =>
	render(<AddParticipantsModal callId='call-id' rid='room-id' onClose={jest.fn()} {...props} />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/users.autocomplete', autocomplete)
			.withEndpoint('GET', '/v1/channels.members', channelMembers)
			.withEndpoint('POST', '/v1/video-conference.add-participants', addParticipants)
			.withJohnDoe()
			.build(),
	});

const typeFilter = async (term: string) => {
	await userEvent.type(screen.getByRole('combobox'), term);
};

// The shared picker labels an option with the username unless the workspace displays real names, which is the
// default this renders under.
const selectOutsider = async () => {
	await typeFilter('outsider');
	await userEvent.click(await screen.findByRole('option', { name: outsider.username }));
};

beforeEach(() => {
	autocomplete.mockClear();
	channelMembers.mockClear();
	addParticipants.mockClear();
	dispatchToastMessage.mockClear();
	// The room-absent scenario (a conference member with no chat access) must be genuinely absent, not
	// left over from a previous test that seeded it.
	Rooms.state.replaceAll([]);
	// The ring preference outlives a test, being remembered in storage on purpose.
	localStorage.clear();
});

it('adds the selected user to the conference', async () => {
	renderModal();

	await selectOutsider();
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(addParticipants).toHaveBeenCalledWith({ callId: 'call-id', users: ['outsider'], ring: true }));
});

it('disables the Add button until a user is selected', async () => {
	renderModal();

	expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

	await selectOutsider();

	expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
});

it('excludes the room members from the autocomplete when the room is in the store', async () => {
	Rooms.state.store(createFakeRoom({ _id: 'room-id', t: 'c' }));

	renderModal();

	await typeFilter('outsider');

	// The mount-time query fires immediately with no term and no exceptions, and the members list arrives on its
	// own schedule, so "has been called" and "the last call so far" prove nothing about either. Wait for the query
	// the test is about — the debounced term and the loaded exceptions travelling together — and read that one.
	const selectorFor = (term: string) =>
		autocomplete.mock.calls.map(([params]) => JSON.parse(params.selector)).find((selector) => selector.term === term);

	await waitFor(() => expect(selectorFor('outsider')).toBeDefined());

	expect(selectorFor('outsider')).toEqual({ term: 'outsider', exceptions: ['member'] });
});

// This is the regression that matters: a conference member added from outside the room has no room in
// this store, and the autocomplete used to be gated on `enabled: !!room`, which left it permanently
// empty for exactly the people this modal exists to serve.
it('still fetches and offers users when the room is not in the store', async () => {
	renderModal();

	await typeFilter('outsider');

	await waitFor(() => expect(autocomplete).toHaveBeenCalled());
	expect(await screen.findByRole('option', { name: outsider.username })).toBeInTheDocument();
});

// The server skips anyone already associated with the call, so a selection can come back having added
// nobody. Reporting that as success would claim people were called who never were.
it('says so when everyone selected was already in the call', async () => {
	addParticipants.mockReturnValueOnce({ added: [], success: true } as any);

	renderModal();

	await selectOutsider();
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() =>
		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'info', message: 'Selected_users_are_already_in_the_call' }),
	);
});

it('reports the users it did add', async () => {
	renderModal();

	await selectOutsider();
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'success', message: 'Users_added' }));
});

// Taking a selection back is no longer this modal's doing: picking people is `UserAutoCompleteMultiple`, the
// same component the room's own "add users" flow uses, and chips are how it offers that.

// Someone added so they can join later is not someone to interrupt now, so adding asks the same question the
// preflight does — and remembers the same answer, since it is one habit rather than two.
it('adds without ringing when ringing is turned off', async () => {
	renderModal();

	await selectOutsider();
	await userEvent.click(screen.getByRole('checkbox', { name: 'Ring_people' }));
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(addParticipants).toHaveBeenCalledWith({ callId: 'call-id', users: ['outsider'], ring: false }));
});
