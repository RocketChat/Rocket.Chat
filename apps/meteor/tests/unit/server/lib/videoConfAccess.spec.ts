import type { VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const canAccessRoomIdAsyncMock = sinon.stub();

const { canAccessConference } = p.noCallThru().load('../../../../server/lib/videoConfAccess', {
	'./authorization/canAccessRoom': { canAccessRoomIdAsync: canAccessRoomIdAsyncMock },
});

type Call = Pick<VideoConference, 'rid' | 'discussionRid' | 'users'>;

const callWith = (memberIds: string[], overrides: Partial<Call> = {}): Call =>
	({
		rid: 'room1',
		users: memberIds.map((_id) => ({ _id })),
		...overrides,
	}) as Call;

describe('canAccessConference', () => {
	beforeEach(() => {
		canAccessRoomIdAsyncMock.reset();
		canAccessRoomIdAsyncMock.resolves(false);
	});

	// The regression this exists for. A conference started in a DM, joined by a third person: they are a member of
	// the call and have no subscription to the DM, by design. Checking the room instead of the membership refused
	// them the credentials for their own call — they saw themselves alone with controls that did nothing.
	it('admits a member who has no access to the call’s room', async () => {
		expect(await canAccessConference(callWith(['dm-one', 'dm-two', 'added']), 'added')).to.be.true;
		expect(canAccessRoomIdAsyncMock.called, 'membership settles it without asking about the room').to.be.false;
	});

	it('admits someone who can see the room the call started in', async () => {
		canAccessRoomIdAsyncMock.withArgs('room1', 'onlooker').resolves(true);

		expect(await canAccessConference(callWith(['host']), 'onlooker')).to.be.true;
	});

	// A conference's chat can move to a discussion whose members have no access to the parent room, so that
	// discussion is its own way in.
	it('admits someone who can see the discussion the chat moved to', async () => {
		canAccessRoomIdAsyncMock.withArgs('discussion1', 'discussion-member').resolves(true);

		expect(await canAccessConference(callWith(['host'], { discussionRid: 'discussion1' }), 'discussion-member')).to.be.true;
	});

	it('refuses a stranger, and anyone not signed in', async () => {
		expect(await canAccessConference(callWith(['host']), 'stranger')).to.be.false;
		expect(await canAccessConference(callWith(['host']), undefined)).to.be.false;
	});
});
