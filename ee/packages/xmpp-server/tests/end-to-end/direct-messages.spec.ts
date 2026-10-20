import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import type { IRoom } from '@rocket.chat/core-typings';

import { uniqueSuffix, withUppercaseDomain } from './helper/config';
import { isChat, replacedId } from './helper/predicates';
import {
	createDirectMessage,
	createLocalUser,
	createPlainGroup,
	expectStoredOnce,
	findUser,
	inviteToRoom,
	overrideSetting,
	sendMessage,
	teardown,
	updateMessage,
	waitForDirectMessageWith,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import type { XmppUser } from './helper/xmpp-client';
import { escapeLocalpart } from '../../src/jid/escaping';

// Lets usernames hold `@` and `'`, as SAML, LDAP or an admin can
const WIDENED_USERNAMES = "[0-9a-zA-Z-_.@']+";

describe('XMPP federation: direct messages', () => {
	let rc: RocketChat;
	let alice: XmppUser;
	let local: LocalUser;
	let dm: IRoom;
	const firstContact = `first contact ${uniqueSuffix()}`;

	// Every test needs the DM, so a single one can run on its own with --test-name-pattern
	before(async () => {
		rc = await setupSuite();
		alice = await registerXmppUser(rc, 'alice');
		await assertFederationReachable(rc, alice);
		local = await createLocalUser(rc, 'dm');
		await alice.sendChat(local.jid, firstContact);
		dm = await waitForDirectMessageWith(rc, local, alice.bareJid);
	});

	after(() => teardown(rc));

	it('materializes the remote user and a federated DM on the first inbound message (R1, addressing R3)', async () => {
		assert.ok(dm.xmppFederation?.role === 'dm', `expected a dm room, got ${dm.xmppFederation?.role}`);
		assert.equal(dm.xmppFederation.with, alice.bareJid);

		const message = await expectStoredOnce(local, dm, firstContact);
		assert.equal(message.u.username, alice.bareJid);

		const remoteUser = await findUser(rc, alice.bareJid);
		assert.equal(remoteUser?.federated, true);
	});

	it('stores a redelivered stanza id once (R4)', async () => {
		const text = `redelivered ${uniqueSuffix()}`;
		const id = `e2e-${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text, { id });
		await alice.sendChat(local.jid, text, { id });
		await expectStoredOnce(local, dm, text);
	});

	it('ignores a message addressed to a user Rocket.Chat does not have (R2)', async () => {
		const ghost = `xe2e-ghost-${uniqueSuffix()}`;
		await alice.sendChat(`${ghost}@${rc.domain}`, `nobody home ${uniqueSuffix()}`);
		await sleep(3000);
		assert.equal(await findUser(rc, ghost), undefined);
	});

	it('delivers a message sent from Rocket.Chat, carrying its message id (R5)', async () => {
		const room = await createDirectMessage(rc, local, alice.bareJid);
		assert.equal(room._id, dm._id, 'im.create should reuse the federated DM');

		const text = `from rocket.chat ${uniqueSuffix()}`;
		const sent = await sendMessage(local, room._id, text);
		const received = await alice.waitFor(isChat({ from: local.jid, body: text }), 'the DM from Rocket.Chat');
		assert.equal(received.attrs.id, sent._id);
	});

	it('reuses the DM when the JID is typed with another spelling of its domain (R7, addressing R4)', async () => {
		const room = await createDirectMessage(rc, local, withUppercaseDomain(alice.bareJid));
		assert.equal(room._id, dm._id);
	});

	it('opens a DM with a JID Rocket.Chat has never seen, and delivers to it (R7)', async () => {
		const stranger = await registerXmppUser(rc, 'stranger');
		const room = await createDirectMessage(rc, local, stranger.bareJid);
		assert.ok(room.xmppFederation?.role === 'dm', `expected a dm room, got ${room.xmppFederation?.role}`);
		assert.equal(room.xmppFederation.with, stranger.bareJid);

		const text = `to a stranger ${uniqueSuffix()}`;
		await sendMessage(local, room._id, text);
		await stranger.waitFor(isChat({ from: local.jid, body: text }), 'the DM from Rocket.Chat');
	});

	it('opens a federated DM with a known XMPP user from a Rocket.Chat user who had none (R7)', async () => {
		const other = await createLocalUser(rc, 'dm-other');
		const room = await createDirectMessage(rc, other, alice.bareJid);
		assert.ok(room.xmppFederation?.role === 'dm', `expected a dm room, got ${room.xmppFederation?.role}`);

		const text = `from another user ${uniqueSuffix()}`;
		await sendMessage(other, room._id, text);
		await alice.waitFor(isChat({ from: other.jid, body: text }), 'the DM from the other Rocket.Chat user');
	});

	it('delivers an edit as an XEP-0308 correction, not a second message (R9, message-corrections R1)', async () => {
		const original = await sendMessage(local, dm._id, `before edit ${uniqueSuffix()}`);
		await alice.waitFor(isChat({ from: local.jid, body: original.msg }), 'the original message');

		const edited = `after edit ${uniqueSuffix()}`;
		await updateMessage(local, dm._id, original._id, edited);
		const correction = await alice.expectOnce(isChat({ from: local.jid, body: edited }), 'the edited text');
		assert.equal(replacedId(correction), original._id);
		assert.notEqual(correction.attrs.id, original._id, 'a correction needs an id of its own');
	});

	it('applies a correction from the XMPP user to the stored message (message-corrections R4)', async () => {
		const id = `e2e-${uniqueSuffix()}`;
		const text = `before correction ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text, { id });
		const original = await waitForMessage(local, dm, text);

		const corrected = `after correction ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, corrected, { replaces: id });
		const stored = await expectStoredOnce(local, dm, corrected);
		assert.equal(stored._id, original._id);
	});

	it('does not echo an inbound message back to its author (R6)', async () => {
		const text = `no echo ${uniqueSuffix()}`;
		const after = alice.cursor();
		await alice.sendChat(local.jid, text);
		await waitForMessage(local, dm, text);
		await alice.expectNone(isChat({ from: local.jid, body: text }), 'an echo of her own message', { after });
	});

	// Known defect: ../../docs/specs/addressing.md#d1-a-local-username-shaped-like-a-bare-jid-is-taken-for-an-xmpp-account
	it.skip('treats a local user whose username looks like a JID as that local user (addressing D1)', async () => {
		await overrideSetting(rc, 'UTF8_User_Names_Validation', WIDENED_USERNAMES);
		const lookalike = await createLocalUser(rc, 'lookalike', `xe2e-lookalike-${uniqueSuffix()}@corp.example`);

		const room = await createDirectMessage(rc, lookalike, alice.bareJid);
		assert.ok(room.xmppFederation?.role === 'dm', `expected a dm room, got ${room.xmppFederation?.role}`);
		assert.equal((await findUser(rc, lookalike.username))?.xmppFederation, undefined);

		await inviteToRoom(local, await createPlainGroup(rc, local), lookalike.username);
	});

	// Known defect: ../../docs/specs/addressing.md#d2-local-jids-are-not-escaped
	it.skip('sends from the escaped JID of a local user whose username needs escaping (addressing D2)', async () => {
		await overrideSetting(rc, 'UTF8_User_Names_Validation', WIDENED_USERNAMES);
		const quoted = await createLocalUser(rc, "o'quote");
		const escapedJid = `${escapeLocalpart(quoted.username)}@${rc.domain}`;

		const room = await createDirectMessage(rc, quoted, alice.bareJid);
		const text = `escaped ${uniqueSuffix()}`;
		await sendMessage(quoted, room._id, text);
		await alice.waitFor(isChat({ from: escapedJid, body: text }), 'the DM from the escaped JID');

		const reply = `reply ${uniqueSuffix()}`;
		await alice.sendChat(escapedJid, reply);
		await waitForMessage(quoted, room, reply);
	});
});
