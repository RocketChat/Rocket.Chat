import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import type { IRoom } from '@rocket.chat/core-typings';

import { uniqueSuffix } from './helper/config';
import {
	createDirectMessage,
	createLocalUser,
	expectStoredOnce,
	findUser,
	sendMessage,
	teardown,
	updateMessage,
	waitForDirectMessageWith,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import { isChat, replacedId } from './helper/xmpp-client';
import type { XmppUser } from './helper/xmpp-client';

describe('XMPP federation: direct messages', () => {
	let rc: RocketChat;
	let alice: XmppUser;
	let local: LocalUser;
	let dm: IRoom;

	before(async () => {
		rc = await setupSuite();
		alice = await registerXmppUser(rc, 'alice');
		await assertFederationReachable(rc, alice);
		local = await createLocalUser(rc, 'dm');
	});

	after(() => teardown(rc));

	it('materializes the remote user and a federated DM on the first inbound message', async () => {
		const text = `first contact ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text);

		dm = await waitForDirectMessageWith(rc, local, alice.jid);
		assert.equal(dm.xmppFederation?.role, 'dm');
		assert.equal(dm.xmppFederation?.with, alice.jid);

		const message = await expectStoredOnce(local, dm, text);
		assert.equal(message.u.username, alice.jid);

		const remoteUser = await findUser(rc, alice.jid);
		assert.equal(remoteUser?.federated, true);
	});

	it('stores a redelivered stanza id once', async () => {
		const text = `redelivered ${uniqueSuffix()}`;
		const id = `e2e-${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text, { id });
		await alice.sendChat(local.jid, text, { id });
		await expectStoredOnce(local, dm, text);
	});

	it('ignores a message addressed to a user Rocket.Chat does not have', async () => {
		const ghost = `xe2e-ghost-${uniqueSuffix()}`;
		await alice.sendChat(`${ghost}@${rc.domain}`, `nobody home ${uniqueSuffix()}`);
		await sleep(3000);
		assert.equal(await findUser(rc, ghost), undefined);
	});

	it('delivers a message sent from Rocket.Chat, carrying its message id', async () => {
		const room = await createDirectMessage(rc, local, alice.jid);
		assert.equal(room._id, dm._id, 'im.create should reuse the federated DM');

		const text = `from rocket.chat ${uniqueSuffix()}`;
		const sent = await sendMessage(local, room._id, text);
		const received = await alice.waitFor(isChat({ from: local.jid, body: text }), 'the DM from Rocket.Chat');
		assert.equal(received.attrs.id, sent._id);
	});

	it('delivers an edit as an XEP-0308 correction, not a second message', async () => {
		const original = await sendMessage(local, dm._id, `before edit ${uniqueSuffix()}`);
		await alice.waitFor(isChat({ from: local.jid, body: original.msg }), 'the original message');

		const edited = `after edit ${uniqueSuffix()}`;
		await updateMessage(local, dm._id, original._id, edited);
		const correction = await alice.expectOnce(isChat({ from: local.jid, body: edited }), 'the edited text');
		assert.equal(replacedId(correction), original._id);
		assert.notEqual(correction.attrs.id, original._id, 'a correction needs an id of its own');
	});

	// Known defect: ../../docs/specs/message-corrections.md#d1-corrections-from-xmpp-users-arrive-as-new-messages
	it.skip('applies a correction from the XMPP user to the stored message', async () => {
		const id = `e2e-${uniqueSuffix()}`;
		const text = `before correction ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text, { id });
		const original = await waitForMessage(local, dm, text);

		const corrected = `after correction ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, corrected, { replaces: id });
		const stored = await expectStoredOnce(local, dm, corrected);
		assert.equal(stored._id, original._id);
	});

	it('does not echo an inbound message back to its author', async () => {
		const text = `no echo ${uniqueSuffix()}`;
		const after = alice.cursor();
		await alice.sendChat(local.jid, text);
		await waitForMessage(local, dm, text);
		await alice.expectNone(isChat({ from: local.jid, body: text }), 'an echo of her own message', { after });
	});
});
