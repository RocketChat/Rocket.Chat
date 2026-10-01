import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import { xml } from '@xmpp/client';

import { config, polling, uniqueSuffix } from './helper/config';
import { createLocalUser, findDirectMessageWith, getSetting, setSetting, teardown } from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, serviceStats, setupSuite } from './helper/suite';
import { NS } from './helper/xmpp-client';
import type { XmppUser } from './helper/xmpp-client';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';

describe('XMPP federation: connectivity', () => {
	let rc: RocketChat;
	let alice: XmppUser;
	let local: LocalUser;

	before(async () => {
		rc = await setupSuite();
		alice = await registerXmppUser(rc, 'alice');
		await assertFederationReachable(rc, alice);
		local = await createLocalUser(rc, 'conn');
	});

	after(() => teardown(rc));

	it('answers a ping to its domain over S2S', async () => {
		const reply = await alice.ping(rc.domain);
		assert.equal(reply.attrs.type, 'result');
	});

	it('advertises its identity and features through disco#info', async () => {
		const query = (await alice.discoInfo(rc.domain)).getChild('query', NS.discoInfo);
		assert.equal(query?.getChild('identity')?.attrs.category, 'server');

		const features = query?.getChildren('feature').map((feature) => feature.attrs.var) ?? [];
		for (const feature of [NS.discoInfo, NS.discoItems, NS.ping]) {
			assert.ok(features.includes(feature), `missing ${feature} in ${features.join(', ')}`);
		}
	});

	it('exposes the MUC service as a conference/text component', async () => {
		const identity = (await alice.discoInfo(rc.mucDomain)).getChild('query', NS.discoInfo)?.getChild('identity');
		assert.equal(identity?.attrs.category, 'conference');
		assert.equal(identity?.attrs.type, 'text');
	});

	it('answers an unsupported IQ with service-unavailable', async () => {
		await assert.rejects(alice.iq('get', rc.domain, xml('query', { xmlns: 'urn:xmpp-e2e:unsupported' })), {
			condition: 'service-unavailable',
		});
	});

	// Known defect: ../../docs/specs/configuration-and-lifecycle.md#d1-allow-list-changes-need-a-service-restart
	it.skip('drops messages from a domain outside the allow list', async () => {
		const original = await getSetting<string>(rc, 'XMPP_Server_Domain_Allow_List');
		try {
			await setSetting(rc, 'XMPP_Server_Domain_Allow_List', 'only-this.invalid');
			// The service applies setting changes asynchronously
			await sleep(2000);

			await alice.sendChat(local.jid, `blocked ${uniqueSuffix()}`);
			await sleep(4000);
			assert.equal(await findDirectMessageWith(local, alice.jid), undefined, 'a DM was created for a blocked domain');
		} finally {
			await setSetting(rc, 'XMPP_Server_Domain_Allow_List', original);
		}
		await retry(
			'federation to recover once the allow list is restored',
			async () => {
				await alice.ping(rc.domain);
			},
			polling,
		);
	});

	describe('service endpoints', () => {
		let reachable = false;

		before(async () => {
			reachable = (await serviceStats()) !== undefined;
		});

		it('reports healthy', async (t) => {
			if (!reachable) {
				return t.skip(`${config.serviceUrl} is not reachable`);
			}
			const res = await fetch(`${config.serviceUrl}/health`);
			assert.equal(res.status, 200);
		});

		it('counts handled inbound messages in /stats', async (t) => {
			if (!reachable) {
				return t.skip(`${config.serviceUrl} is not reachable`);
			}
			const handledBefore = (await serviceStats())?.completed['message.received'] ?? 0;
			await alice.sendChat(local.jid, `counted ${uniqueSuffix()}`);
			await retry(
				'message.received to be counted',
				async () => {
					const handled = (await serviceStats())?.completed['message.received'] ?? 0;
					assert.ok(handled > handledBefore, `still ${handled}`);
				},
				polling,
			);
		});
	});
});
