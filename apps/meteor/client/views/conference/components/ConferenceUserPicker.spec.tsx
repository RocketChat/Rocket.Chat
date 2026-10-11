import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConferenceUserPicker from './ConferenceUserPicker';
import { createFakeRoom } from '../../../../tests/mocks/data';

/**
 * Which names this picker offers, and which it leaves out, is the whole of what it adds to the product's
 * autocomplete — so that is what is tested here. What the modal around it does with a selection is the
 * package's, and is tested there.
 */
const outsider = { _id: 'outsider-id', username: 'outsider', name: 'Outsider Person', nickname: '', status: 'online', avatarETag: '' };
const memberUser = { _id: 'member-id', username: 'member', name: 'Room Member', nickname: '', status: 'online', avatarETag: '' };

const autocomplete = jest.fn((_params: { selector: string }) => ({ items: [outsider, memberUser] }) as any);

/**
 * What the picker asked the server for this term, if it asked at all.
 *
 * The mount-time query fires immediately with no term and no exceptions, and the members list arrives on its own
 * schedule, so "has been called" and "the last call so far" prove nothing about either — including that typing
 * still fetches anything. Every assertion about the picker's request goes through here.
 */
const askedFor = (term: string) =>
	autocomplete.mock.calls.map(([params]) => JSON.parse(params.selector)).find((selector) => selector.term === term);

// One endpoint for every room type that has a members list, paged: the picker keeps asking until it holds the
// whole membership, because `API_Upper_Count_Limit` can cap a page well below what was requested.
const oneRoomMember = (_params: { offset?: number }) =>
	({ members: [{ _id: 'member-id', username: 'member' }], count: 1, offset: 0, total: 1, success: true }) as any;

const roomMembers = jest.fn(oneRoomMember);

// The room is what the workspace knows about `rid`, and a conference member added from outside it knows
// nothing — so it is given per test rather than seeded globally.
const renderPicker = ({ rid = 'room-id' }: { rid?: string } = {}, room?: IRoom) => {
	const appRoot = mockAppRoot()
		.withJohnDoe()
		.withEndpoint('GET', '/v1/users.autocomplete', autocomplete)
		.withEndpoint('GET', '/v1/rooms.membersOrderedByRole', roomMembers);

	return render(<ConferenceUserPicker rid={rid} value={[]} onChange={jest.fn()} placeholder='Choose_users' />, {
		wrapper: (room ? appRoot.withRoom(room) : appRoot).build(),
	});
};

const typeFilter = async (term: string) => {
	// The picker stays shut until the room's membership is in, since that is what keeps existing members out of
	// the options — so waiting for it to open is part of using it.
	const picker = screen.getByRole('combobox');
	await waitFor(() => expect(picker).toBeEnabled());

	await userEvent.type(picker, term);
};

beforeEach(() => {
	autocomplete.mockReset();
	autocomplete.mockImplementation(() => ({ items: [outsider, memberUser] }) as any);
	// `mockReset` and not `mockClear`: the paging test installs an implementation of its own, and clearing leaves
	// it in place for whatever runs next — which makes those tests depend on the order they happen to run in.
	roomMembers.mockReset();
	roomMembers.mockImplementation(oneRoomMember);
});

it('excludes the room members from the autocomplete when the workspace knows the room', async () => {
	renderPicker({}, createFakeRoom({ _id: 'room-id', t: 'c' }));

	await typeFilter('outsider');

	// The debounced term and the loaded exceptions have to travel together, so this waits for the one request the
	// test is about rather than for whichever went first.
	await waitFor(() => expect(askedFor('outsider')).toBeDefined());

	expect(askedFor('outsider')).toEqual({ term: 'outsider', exceptions: ['member'] });
});

// `API_Upper_Count_Limit` caps every paginated endpoint and cannot be read from the client, so a workspace
// that sets it low answers a request for 100 members with far fewer. Taking the first answer as the whole
// membership left room members in the picker as if they were not members at all.
it('keeps asking until it holds the whole membership, however small the pages are', async () => {
	const everyone = ['member', 'second', 'third'];
	roomMembers.mockImplementation(
		({ offset = 0 }) =>
			({
				members: everyone.slice(offset, offset + 1).map((username) => ({ _id: `${username}-id`, username })),
				count: 1,
				offset,
				total: everyone.length,
				success: true,
			}) as any,
	);

	renderPicker({}, createFakeRoom({ _id: 'room-id', t: 'c' }));

	await typeFilter('outsider');

	await waitFor(() => expect(askedFor('outsider')).toBeDefined());

	expect(askedFor('outsider')).toEqual({ term: 'outsider', exceptions: everyone });
});

// This is the regression that matters: a conference member added from outside the room has no room to read,
// and the autocomplete used to be gated on `enabled: !!room`, which left it permanently empty for exactly the
// people the add-participants modal exists to serve.
it('still fetches and offers users when there is no room to read', async () => {
	renderPicker();

	await typeFilter('outsider');

	// For the request the typing made, not merely for one: the picker asks once on mount with an empty term, so
	// `toHaveBeenCalled` would hold even if typing had stopped fetching anything at all.
	await waitFor(() => expect(askedFor('outsider')).toBeDefined());
	expect(await screen.findByRole('option', { name: outsider.username })).toBeInTheDocument();
});
