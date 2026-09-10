import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, credentials } from '../../data/api-data';
import { mediaCallReaderTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { IS_EE } from '../../e2e/config/constants';

// Test fixture call IDs seeded by callHistoryTestData.ts
const INTERNAL_CALL_ID = 'rocketchat.internal.call.test';
const EXTERNAL_CALL_ID = 'rocketchat.external.call.test.outbound';

(IS_EE ? describe : describe.skip)('Apps - MediaCallRead accessor', () => {
	describe('[with media-call.read permission]', () => {
		let app: App;

		before((done) => getCredentials(done));

		before(async () => {
			await cleanupApps();
			app = await installLocalTestPackage(mediaCallReaderTest);
		});

		after(() => cleanupApps());

		it('should return an internal call by ID', async () => {
			await request
				.get(apps(`/public/${app.id}/read-call`))
				.set(credentials)
				.query({ callId: INTERNAL_CALL_ID })
				.expect('Content-Type', /json/)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('call').that.is.an('object');

					const { call } = res.body;
					expect(call).to.have.property('_id', INTERNAL_CALL_ID);
					expect(call).to.have.property('service', 'webrtc');
					expect(call).to.have.property('kind', 'direct');
					expect(call).to.have.property('state', 'hangup');
					expect(call).to.have.property('ended', true);
					expect(call).to.have.property('createdBy').that.is.an('object');
					expect(call.createdBy).to.have.property('type', 'user');
					expect(call).to.have.property('caller').that.is.an('object');
					expect(call.caller).to.have.property('type', 'user');
					expect(call).to.have.property('callee').that.is.an('object');
					expect(call.callee).to.have.property('type', 'user');
					expect(call).to.have.property('uids').that.is.an('array').with.lengthOf(2);
					expect(call).to.have.property('features').that.is.an('array');
				});
		});

		it('should return an external call by ID', async () => {
			await request
				.get(apps(`/public/${app.id}/read-call`))
				.set(credentials)
				.query({ callId: EXTERNAL_CALL_ID })
				.expect('Content-Type', /json/)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('call').that.is.an('object');

					const { call } = res.body;
					expect(call).to.have.property('_id', EXTERNAL_CALL_ID);
					expect(call).to.have.property('service', 'webrtc');
					expect(call).to.have.property('kind', 'direct');
					expect(call).to.have.property('state', 'hangup');
					expect(call).to.have.property('ended', true);
					expect(call).to.have.property('sipCallId').that.is.a('string');
					expect(call).to.have.property('callee').that.is.an('object');
					expect(call.callee).to.have.property('type', 'sip');
					expect(call).to.have.property('uids').that.is.an('array').with.lengthOf(1);
				});
		});
	});

	describe('[without media-call.read permission]', () => {
		let app: App;

		before((done) => getCredentials(done));

		before(async () => {
			await cleanupApps();
			app = await installLocalTestPackage(mediaCallReaderTest, { withPermissions: false });
		});

		after(() => cleanupApps());

		it('should return null when the app does not have the media-call.read permission', async () => {
			await request
				.get(apps(`/public/${app.id}/read-call`))
				.set(credentials)
				.query({ callId: INTERNAL_CALL_ID })
				.expect('Content-Type', /json/)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('call', null);
				});
		});
	});
});
