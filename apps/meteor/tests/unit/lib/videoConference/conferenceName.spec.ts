import { expect } from 'chai';

import { conferenceNameFor } from '../../../../lib/videoConference/conferenceName';

const rodrigo = { _id: 'rodrigo', name: 'Rodrigo Nascimento', username: 'rodrigo.nascimento' };
const alice = { _id: 'alice', name: 'Alice', username: 'alice' };
const cleiton = { _id: 'cleiton', name: 'Cleiton', username: 'cleiton' };

/** A call in a DM between Rodrigo and Alice, started by Rodrigo, with Cleiton added from outside. */
const dmCall = {
	type: 'direct' as const,
	createdBy: rodrigo,
	users: [alice, rodrigo, cleiton],
};

describe('conferenceNameFor', () => {
	// The bug this exists for. Cleiton is a member of the call and has no subscription to the DM it happens in, by
	// design — so the name fell through to the room, a DM room has neither `name` nor `fname`, and the last resort
	// was the raw room id. What he needs to know is who is calling.
	it('names a direct call after whoever started it, for someone added from outside', () => {
		expect(conferenceNameFor(dmCall, 'cleiton')).to.equal('Rodrigo Nascimento');
	});

	// The creator is not the answer for the creator: they know who they are.
	it('names it after the other person when the viewer started it', () => {
		expect(conferenceNameFor(dmCall, 'rodrigo')).to.equal('Alice');
	});

	// Where a subscription exists it is the better answer: a DM is named per side, and that is where the name lives.
	it("prefers the reader's own subscription", () => {
		expect(conferenceNameFor(dmCall, 'alice', 'Rodrigo N.')).to.equal('Rodrigo N.');
	});

	it('names a group conference by its title, whoever is asking', () => {
		const group = { type: 'videoconference' as const, title: 'Sprint planning', createdBy: rodrigo, users: [rodrigo, alice] };

		expect(conferenceNameFor(group, 'alice')).to.equal('Sprint planning');
		expect(conferenceNameFor(group, 'alice', 'the-channel')).to.equal('Sprint planning');
	});

	// A non-ringing DM call is `type: 'videoconference'` with a title set from `room.fname`. That title is the
	// creator's view of the room, so Alice sees her own name — wrong. When the room is a DM, the per-viewer
	// subscription name wins over the title.
	it('prefers the subscription name over the title in a DM room', () => {
		const nonRingingDm = { type: 'videoconference' as const, title: 'Alice', createdBy: rodrigo, users: [rodrigo] };

		expect(conferenceNameFor(nonRingingDm, 'alice', 'Rodrigo Nascimento', 'd')).to.equal('Rodrigo Nascimento');
		expect(conferenceNameFor(nonRingingDm, 'rodrigo', 'Alice', 'd')).to.equal('Alice');
	});

	// Without a subscription (member added from outside), fall back to the other-party logic even in a DM
	// videoconference, so the member sees the name of whoever started the call.
	it('names a DM videoconference after the creator when no subscription exists', () => {
		const nonRingingDm = { type: 'videoconference' as const, title: 'Alice', createdBy: rodrigo, users: [rodrigo] };

		expect(conferenceNameFor(nonRingingDm, 'cleiton', undefined, 'd')).to.equal('Rodrigo Nascimento');
	});

	// A room-named call is the caller's to resolve, because only the caller can read the room — and making that
	// explicit is what keeps the room lookup off the path that doesn't need it.
	it('answers with nothing when only the room can say', () => {
		const untitled = { type: 'videoconference' as const, createdBy: rodrigo, users: [rodrigo, alice] };

		expect(conferenceNameFor(untitled, 'alice')).to.equal('');
	});

	it('falls back to a username when a member has no name', () => {
		const call = { ...dmCall, createdBy: { _id: 'rodrigo', username: 'rodrigo.nascimento' } };

		expect(conferenceNameFor(call, 'cleiton')).to.equal('rodrigo.nascimento');
	});
});
