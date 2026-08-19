import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, credentials } from '../../data/api-data';
import { callHistoryReaderTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { IS_EE } from '../../e2e/config/constants';

// Seeded at boot by apps/meteor/server/startup/callHistoryTestData.ts.
const INTERNAL_HISTORY_ID = 'rocketchat.internal.history.test.outbound';
const EXTERNAL_HISTORY_ID = 'rocketchat.external.history.test.outbound';
// The one call with a row for each of its two participants.
const SHARED_CALL_ID = 'rocketchat.internal.call.test';
const ADMIN_UID = 'rocketchat.internal.admin.test';
const CONTACT_UID = 'rocket.cat';

(IS_EE ? describe : describe.skip)('Apps - CallHistoryRead accessor', () => {
	describe('[with media-call.history permission]', () => {
		let app: App;

		before((done) => getCredentials(done));

		before(async () => {
			await cleanupApps();
			app = await installLocalTestPackage(callHistoryReaderTest);
		});

		after(() => cleanupApps());

		const readById = (historyId: string) =>
			request
				.get(apps(`/public/${app.id}/read-by-id`))
				.set(credentials)
				.query({ historyId });

		const find = (query: Record<string, string | number> = {}) =>
			request
				.get(apps(`/public/${app.id}/find`))
				.set(credentials)
				.query(query);

		it('should return an internal entry by history id', async () => {
			await readById(INTERNAL_HISTORY_ID)
				.expect('Content-Type', /json/)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('entry').that.is.an('object');

					const { item, call } = res.body.entry;

					expect(item).to.have.property('id', INTERNAL_HISTORY_ID);
					expect(item).to.have.property('callId', SHARED_CALL_ID);
					expect(item).to.have.property('uid', ADMIN_UID);
					expect(item).to.have.property('direction', 'outbound');
					expect(item).to.have.property('state', 'ended');
					expect(item).to.have.property('durationSeconds', 10);
					expect(item).to.have.property('contact').that.deep.includes({ type: 'user', userId: CONTACT_UID });

					// The joined half: the audit detail the history row does not carry.
					expect(call).to.be.an('object');
					expect(call).to.have.property('state', 'hangup');
					expect(call).to.have.property('features').that.is.an('array');
				});
		});

		it('should return an external entry with a numbered contact', async () => {
			await readById(EXTERNAL_HISTORY_ID)
				.expect(200)
				.expect((res: Response) => {
					const { item } = res.body.entry;

					expect(item).to.have.property('state', 'failed');
					expect(item).to.have.property('contact').that.deep.equals({ type: 'external', number: '1001' });
					expect(item).to.not.have.property('roomId');
				});
		});

		it('should return null for a history id that does not exist', async () => {
			await readById('does-not-exist')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('entry', null);
				});
		});

		it('should return both participants rows for one call id', async () => {
			await request
				.get(apps(`/public/${app.id}/read-by-call-id`))
				.set(credentials)
				.query({ callId: SHARED_CALL_ID })
				.expect(200)
				.expect((res: Response) => {
					const { entries } = res.body;

					expect(entries).to.be.an('array').with.lengthOf(2);
					expect(entries.map((entry: any) => entry.item.uid).sort()).to.deep.equal([CONTACT_UID, ADMIN_UID].sort());
					expect(entries.map((entry: any) => entry.item.direction).sort()).to.deep.equal(['inbound', 'outbound']);
				});
		});

		it('should search across every users history', async () => {
			await find()
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('total').that.is.at.least(7);
					expect(res.body).to.have.property('offset', 0);
					expect(res.body).to.have.property('entries').that.is.an('array');

					// The whole point of the workspace-wide read: rows the caller does not own.
					const uids = new Set(res.body.entries.map((entry: any) => entry.item.uid));
					expect(uids.has(CONTACT_UID)).to.be.true;
				});
		});

		it('should narrow the search by uid, direction and state', async () => {
			await find({ uid: ADMIN_UID, direction: 'outbound', states: 'ended' })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.entries).to.be.an('array').that.is.not.empty;

					res.body.entries.forEach((entry: any) => {
						expect(entry.item).to.have.property('uid', ADMIN_UID);
						expect(entry.item).to.have.property('direction', 'outbound');
						expect(entry.item).to.have.property('state', 'ended');
					});
				});
		});

		it('should page, and report a total larger than the page', async () => {
			await find({ count: 2 })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.entries).to.have.lengthOf(2);
					expect(res.body).to.have.property('count', 2);
					expect(res.body.total).to.be.greaterThan(2);
				});
		});

		it('should clamp a page size larger than the maximum instead of failing', async () => {
			await find({ count: 5000 })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.entries.length).to.be.at.most(100);
				});
		});

		// `contractId` is a per-session signing credential. It must not reach an app by any route.
		it('should never expose a call contract id or internal field', async () => {
			await find()
				.expect(200)
				.expect((res: Response) => {
					const serialized = JSON.stringify(res.body);

					expect(serialized).to.not.contain('contract');
					expect(serialized).to.not.contain('expiresAt');
					expect(serialized).to.not.contain('callerRequestedId');
				});
		});
	});

	describe('[without media-call.history permission]', () => {
		let app: App;

		before((done) => getCredentials(done));

		before(async () => {
			await cleanupApps();
			app = await installLocalTestPackage(callHistoryReaderTest, { withPermissions: false });
		});

		after(() => cleanupApps());

		it('should return null instead of an entry', async () => {
			await request
				.get(apps(`/public/${app.id}/read-by-id`))
				.set(credentials)
				.query({ historyId: INTERNAL_HISTORY_ID })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('entry', null);
				});
		});

		it('should return an empty page instead of failing the search', async () => {
			await request
				.get(apps(`/public/${app.id}/find`))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.deep.include({ total: 0, count: 0, offset: 0 });
					expect(res.body.entries).to.be.an('array').that.is.empty;
				});
		});
	});
});
