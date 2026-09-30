import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { IRoom } from '@rocket.chat/core-typings';

import { polling, uniqueSuffix } from './helper/config';
import {
	createHostedRoom,
	createLocalUser,
	deleteRoomOnCleanup,
	expectStoredOnce,
	findUser,
	inviteToRoom,
	kickFromRoom,
	leaveRoom,
	listMemberUsernames,
	sendMessage,
	teardown,
	updateMessage,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import { NS, StanzaError, isGroupchat, isOccupantPresence, isRoomInvite, replacedId, statusCodes } from './helper/xmpp-client';
import type { XmppUser } from './helper/xmpp-client';
import { createRoom } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';

const mucJidOf = (room: IRoom): string => {
	assert.equal(room.xmppFederation?.role, 'host-muc');
	assert.ok(room.xmppFederation.muc, 'hosted room has no MUC JID');
	return room.xmppFederation.muc;
};

const waitForMember = (owner: LocalUser, room: IRoom, username: string, present = true) =>
	retry(
		`${username} to be ${present ? '' : 'no longer '}a member of ${room._id}`,
		async () => {
			assert.equal((await listMemberUsernames(owner, room)).includes(username), present);
		},
		polling,
	);

describe('XMPP federation: rooms hosted by Rocket.Chat', () => {
	let rc: RocketChat;
	let owner: LocalUser;
	let alice: XmppUser;

	before(async () => {
		rc = await setupSuite();
		alice = await registerXmppUser(rc, 'alice');
		await assertFederationReachable(rc, alice);
		owner = await createLocalUser(rc, 'owner');
	});

	after(() => teardown(rc));

	describe('public channel', () => {
		let room: IRoom;
		let muc: string;

		before(async () => {
			room = await createHostedRoom(rc, owner, { type: 'c', name: `xe2e-pub-${uniqueSuffix()}` });
			muc = mucJidOf(room);
		});

		it('is listed by the MUC service', async () => {
			const items = (await alice.discoItems(rc.mucDomain)).getChild('query', NS.discoItems)?.getChildren('item') ?? [];
			assert.ok(
				items.some((item) => item.attrs.jid === muc),
				`${muc} not in ${items.map((item) => item.attrs.jid).join(', ')}`,
			);
		});

		it('admits anyone, showing Rocket.Chat members as occupants', async () => {
			const after = alice.cursor();
			await alice.joinRoom(muc);
			assert.ok(alice.received(isOccupantPresence(muc, owner.username), after).length, 'the owner is not in the roster');
			await waitForMember(owner, room, alice.jid);
		});

		it('relays messages both ways', async () => {
			const inbound = `hello from xmpp ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, inbound);
			const stored = await expectStoredOnce(owner, room, inbound);
			assert.equal(stored.u.username, alice.jid);

			const outbound = `hello from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(owner, room._id, outbound);
			await alice.waitFor(isGroupchat({ roomJid: muc, nick: owner.username, body: outbound }), 'the owner message');
		});

		// Known bug: ../../../../../docs/features/xmpp-server.md#corrections-from-xmpp-users-arrive-as-new-messages
		it.skip('applies a correction from the XMPP user to the stored message', async () => {
			const id = `e2e-${uniqueSuffix()}`;
			const text = `before correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text, { id });
			const original = await waitForMessage(owner, room, text);

			const corrected = `after correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, corrected, { replaces: id });
			const stored = await expectStoredOnce(owner, room, corrected);
			assert.equal(stored._id, original._id);
		});

		it("drops the XMPP user's membership when they leave the room", async () => {
			await alice.leaveRoom(muc);
			await waitForMember(owner, room, alice.jid, false);
		});
	});

	describe('private group', () => {
		let bob: XmppUser;
		let carol: XmppUser;
		let room: IRoom;
		let muc: string;

		before(async () => {
			bob = await registerXmppUser(rc, 'bob');
			carol = await registerXmppUser(rc, 'carol');
			room = await createHostedRoom(rc, owner, { type: 'p', name: `xe2e-priv-${uniqueSuffix()}`, members: [alice.jid] });
			muc = mucJidOf(room);
		});

		it('invites the XMPP members it was created with', async () => {
			await alice.waitFor(isRoomInvite(muc), 'the invitation');
		});

		it('is not listed by the MUC service', async () => {
			const items = (await alice.discoItems(rc.mucDomain)).getChild('query', NS.discoItems)?.getChildren('item') ?? [];
			assert.ok(!items.some((item) => item.attrs.jid === muc));
		});

		it('refuses a join from an XMPP user who was not invited', async () => {
			await assert.rejects(
				carol.joinRoom(muc),
				(error: unknown) => error instanceof StanzaError && error.condition === 'registration-required',
			);
		});

		it('admits the invitee', async () => {
			await alice.joinRoom(muc);
		});

		it('invites an XMPP user added after creation', async () => {
			await inviteToRoom(owner, room, bob.jid);
			await bob.waitFor(isRoomInvite(muc), 'the invitation');
			await bob.joinRoom(muc);
		});

		it('relays messages both ways', async () => {
			const inbound = `private hello ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, inbound);
			await expectStoredOnce(owner, room, inbound);

			const outbound = `private reply ${uniqueSuffix()}`;
			await sendMessage(owner, room._id, outbound);
			await alice.waitFor(isGroupchat({ roomJid: muc, nick: owner.username, body: outbound }), 'the owner reply');
			await bob.waitFor(isGroupchat({ roomJid: muc, nick: owner.username, body: outbound }), 'the owner reply');
		});

		// Known bug: ../../../../../docs/features/xmpp-server.md#the-room-strips-corrections-it-relays-between-xmpp-users
		it.skip("relays an XMPP user's correction to the other XMPP occupants as a correction", async () => {
			const id = `e2e-${uniqueSuffix()}`;
			const text = `before correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text, { id });
			await bob.waitFor(isGroupchat({ roomJid: muc, nick: alice.username, body: text }), "alice's message");

			const corrected = `after correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, corrected, { replaces: id });
			const correction = await bob.waitFor(isGroupchat({ roomJid: muc, nick: alice.username, body: corrected }), "alice's correction");
			assert.equal(replacedId(correction), id);
		});

		it('shows Rocket.Chat members joining and leaving as occupants', async () => {
			const member = await createLocalUser(rc, 'member');
			await inviteToRoom(owner, room, member.username);
			await alice.waitFor(isOccupantPresence(muc, member.username), 'the new member presence');

			await leaveRoom(member, room);
			await alice.waitFor(isOccupantPresence(muc, member.username, { type: 'unavailable' }), 'the member leaving');
		});

		it('kicks an XMPP user removed in Rocket.Chat and tells the other occupants', async () => {
			const bobUser = await findUser(rc, bob.jid);
			assert.ok(bobUser);
			await kickFromRoom(owner, room, bobUser._id);

			const kicked = await alice.waitFor(isOccupantPresence(muc, bob.username, { type: 'unavailable' }), "bob's removal");
			assert.ok(statusCodes(kicked).includes('307'), `expected status 307, got ${statusCodes(kicked).join(',')}`);
		});

		// Known bug: ../../../../../docs/features/xmpp-server.md#kicked-xmpp-users-are-not-told-they-were-removed
		it.skip('tells the kicked XMPP user they were removed', async () => {
			const notice = await bob.waitFor(isOccupantPresence(muc, bob.username, { type: 'unavailable' }), 'his own removal');
			assert.ok(statusCodes(notice).includes('307'));
		});

		it('refuses JIDs in a group that is not XMPP-federated', async () => {
			const res = await createRoom({ type: 'p', name: `xe2e-plain-${uniqueSuffix()}`, config: owner.config });
			const groupId = (res.body as { group: IRoom }).group._id;
			deleteRoomOnCleanup(rc, groupId);
			await assert.rejects(inviteToRoom(owner, { _id: groupId, t: 'p' }, alice.jid), /error-xmpp-users-in-non-xmpp-rooms/);
		});
	});

	describe('with several Rocket.Chat members', () => {
		let members: LocalUser[];
		let room: IRoom;
		let muc: string;

		before(async () => {
			members = [await createLocalUser(rc, 'a'), await createLocalUser(rc, 'b')];
			room = await createHostedRoom(rc, owner, {
				type: 'p',
				name: `xe2e-many-${uniqueSuffix()}`,
				members: [...members.map((member) => member.username), alice.jid],
			});
			muc = mucJidOf(room);
			await alice.waitFor(isRoomInvite(muc), 'the invitation');
			await alice.joinRoom(muc);
		});

		it('stores a message from the XMPP user once', async () => {
			const text = `once from xmpp ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text);
			await expectStoredOnce(owner, room, text);
		});

		it('delivers a Rocket.Chat message to the XMPP user once', async () => {
			const text = `once from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(members[0], room._id, text);
			await alice.expectOnce(isGroupchat({ roomJid: muc, nick: members[0].username, body: text }), 'the message');
		});

		it('keeps both directions single after another Rocket.Chat member joins', async () => {
			const late = await createLocalUser(rc, 'late');
			await inviteToRoom(owner, room, late.username);
			await alice.waitFor(isOccupantPresence(muc, late.username), 'the late member presence');

			const inbound = `after join from xmpp ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, inbound);
			await expectStoredOnce(late, room, inbound);

			const outbound = `after join from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(late, room._id, outbound);
			await alice.expectOnce(isGroupchat({ roomJid: muc, nick: late.username, body: outbound }), 'the late member message');
		});

		it('delivers an edit as an XEP-0308 correction, not a second message', async () => {
			const original = await sendMessage(members[0], room._id, `before edit ${uniqueSuffix()}`);
			await alice.waitFor(isGroupchat({ roomJid: muc, body: original.msg }), 'the original message');

			const edited = `after edit ${uniqueSuffix()}`;
			await updateMessage(members[0], room._id, original._id, edited);
			const correction = await alice.expectOnce(isGroupchat({ roomJid: muc, body: edited }), 'the edited text');
			assert.equal(replacedId(correction), original._id);
			assert.notEqual(correction.attrs.id, original._id, 'a correction needs an id of its own');
		});

		it("keeps an edit of another member's message local", async () => {
			const original = await sendMessage(members[0], room._id, `before moderation ${uniqueSuffix()}`);
			await alice.waitFor(isGroupchat({ roomJid: muc, body: original.msg }), 'the original message');

			const after = alice.cursor();
			const edited = `moderated ${uniqueSuffix()}`;
			await updateMessage(owner, room._id, original._id, edited);
			await waitForMessage(owner, room, edited);
			await alice.expectNone(isGroupchat({ roomJid: muc, body: edited }), "the owner's edit", { after });
		});
	});
});
