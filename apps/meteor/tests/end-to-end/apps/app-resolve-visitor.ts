import type { App, ILivechatVisitor } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appExternalIdTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps } from '../../data/apps/helper';
import { createVisitor, createVisitorWithCustomData, createAgent, makeAgentAvailable } from '../../data/livechat/rooms';
import { updateSetting } from '../../data/permissions.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - resolveVisitor API', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await createAgent();
		await makeAgentAvailable();

		const installResponse = await request.post(apps()).set(credentials).attach('app', appExternalIdTest);
		if (!installResponse.body.success) {
			throw new Error(`Failed to install test app: ${installResponse.body.error}`);
		}

		app = installResponse.body.app;
	});

	after(async () => {
		await cleanupApps();
	});

	const callResolveVisitor = async (
		externalId: { entityId: string; metadata?: Record<string, unknown> },
		contactData?: { phone?: string; email?: string },
	) => {
		return request
			.post(apps(`/public/${app.id}/resolve-visitor`))
			.set(credentials)
			.send({ externalId, phone: contactData?.phone, email: contactData?.email });
	};

	const callUpdateExternalId = async (visitorId: string, externalId: { entityId: string; metadata?: Record<string, unknown> }) => {
		return request
			.post(apps(`/public/${app.id}/update-external-id`))
			.set(credentials)
			.send({ visitorId, externalId });
	};

	describe('externalId lookup', () => {
		it('should return null when externalId does not exist', async () => {
			const response = await callResolveVisitor({ entityId: 'nonexistent-id' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});

		it('should find visitor directly by externalId', async () => {
			const phone = `+1${Date.now()}`;
			const visitor = await createVisitor(undefined, undefined, undefined, phone);

			const externalId = { entityId: `id-${Date.now()}`, metadata: { username: '@user' } };
			await callResolveVisitor(externalId, { phone });

			const response = await callResolveVisitor(externalId);

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const appExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);
			expect(appExternalId.entityId).to.equal(externalId.entityId);
			expect(appExternalId.metadata.username).to.equal(externalId.metadata.username);
		});

		it('should not update externalId when found by lookup', async () => {
			const phone = `+2${Date.now()}`;
			await createVisitor(undefined, undefined, undefined, phone);

			const externalId = { entityId: `id-${Date.now()}`, metadata: { username: '@original' } };
			await callResolveVisitor(externalId, { phone });

			// resolveVisitor is for resolving/enriching visitors, not for updating existing data.
			// When found by externalId, it returns the visitor as-is without modifications.
			// To update visitor data, apps should use other methods like ILivechatUpdater.
			const response = await callResolveVisitor({ entityId: externalId.entityId, metadata: { username: '@changed' } });

			const appExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);
			expect(appExternalId.metadata.username).to.equal('@original');
		});
	});

	describe('phone fallback', () => {
		it('should find visitor by phone and save externalId', async () => {
			const phone = `+3${Date.now()}`;
			const visitor = await createVisitor(undefined, undefined, undefined, phone);

			const externalId = { entityId: `id-${Date.now()}`, metadata: { username: '@user' } };
			const response = await callResolveVisitor(externalId, { phone });

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const appExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);
			expect(appExternalId.entityId).to.equal(externalId.entityId);
			expect(appExternalId.metadata.username).to.equal(externalId.metadata.username);
		});

		it('should overwrite externalId when called with different entityId', async () => {
			const phone = `+4${Date.now()}`;
			await createVisitor(undefined, undefined, undefined, phone);

			await callResolveVisitor({ entityId: `first-${Date.now()}`, metadata: { username: '@first' } }, { phone });

			const newExternalId = { entityId: `second-${Date.now()}`, metadata: { username: '@second' } };
			const response = await callResolveVisitor(newExternalId, { phone });

			const appExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);
			expect(appExternalId.entityId).to.equal(newExternalId.entityId);
			expect(appExternalId.metadata.username).to.equal('@second');
		});

		it('should return null when phone not found', async () => {
			const response = await callResolveVisitor({ entityId: `id-${Date.now()}` }, { phone: '+0000000000' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});

		it('should not use phone fallback when phone is empty', async () => {
			const response = await callResolveVisitor({ entityId: `id-${Date.now()}` }, { phone: '' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});
	});

	describe('email fallback', () => {
		it('should find visitor by email and save externalId', async () => {
			const email = `test-${Date.now()}@example.com`;
			const visitor = await createVisitor(undefined, undefined, email);

			const externalId = { entityId: `id-email-${Date.now()}`, metadata: { username: '@emailuser' } };
			const response = await callResolveVisitor(externalId, { email });

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const appExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);
			expect(appExternalId.entityId).to.equal(externalId.entityId);
			expect(appExternalId.metadata.username).to.equal(externalId.metadata.username);
		});

		it('should overwrite externalId when called with different entityId via email', async () => {
			const email = `test-${Date.now()}@example.com`;
			await createVisitor(undefined, undefined, email);

			await callResolveVisitor({ entityId: `first-email-${Date.now()}`, metadata: { username: '@first' } }, { email });

			const newExternalId = { entityId: `second-email-${Date.now()}`, metadata: { username: '@second' } };
			const response = await callResolveVisitor(newExternalId, { email });

			const appExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);
			expect(appExternalId.entityId).to.equal(newExternalId.entityId);
			expect(appExternalId.metadata.username).to.equal('@second');
		});

		it('should return null when email not found', async () => {
			const response = await callResolveVisitor({ entityId: `id-${Date.now()}` }, { email: 'notfound@example.com' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});

		it('should not use email fallback when email is empty', async () => {
			const response = await callResolveVisitor({ entityId: `id-${Date.now()}` }, { email: '' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});
	});

	describe('cross-appId lookup', () => {
		// Direct MongoDB to inject externalId with a different appId, avoiding the need to install a second test app
		const addExternalIdToVisitor = async (visitorId: string, externalId: { appId: string; entityId: string }) => {
			const connection = await MongoClient.connect(URL_MONGODB);
			try {
				await connection
					.db()
					.collection<ILivechatVisitor>('rocketchat_livechat_visitor')
					.updateOne({ _id: visitorId }, { $push: { externalIds: externalId } });
			} finally {
				await connection.close();
			}
		};

		it('should find visitor by entityId even when externalId was saved by different appId', async () => {
			// Create visitor without phone to ensure we're testing entityId lookup only
			const visitor = await createVisitorWithCustomData({ ignorePhone: true });

			const oldAppId = 'old-app-version-id-12345';
			const entityId = `cross-app-${Date.now()}`;
			await addExternalIdToVisitor(visitor._id, { appId: oldAppId, entityId });

			// App searches by entityId only - should find visitor even though appId is different
			const response = await callResolveVisitor({ entityId });

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const oldExternalId = response.body.visitor.externalIds.find((e: { appId: string }) => e.appId === oldAppId);
			expect(oldExternalId.entityId).to.equal(entityId);
		});

		it('should allow app to add its own externalId using updateVisitorExternalId', async () => {
			const visitor = await createVisitorWithCustomData({ ignorePhone: true });

			const oldAppId = 'old-app-version-id-67890';
			const entityId = `cross-app-update-${Date.now()}`;
			await addExternalIdToVisitor(visitor._id, { appId: oldAppId, entityId });

			const lookupResponse = await callResolveVisitor({ entityId });
			expect(lookupResponse.body.visitor.id).to.equal(visitor._id);

			const newExternalId = { entityId, metadata: { username: '@newversion' } };
			const updateResponse = await callUpdateExternalId(visitor._id, newExternalId);

			expect(updateResponse.status).to.equal(200);
			expect(updateResponse.body.visitor.id).to.equal(visitor._id);

			const oldEntry = updateResponse.body.visitor.externalIds.find((e: { appId: string }) => e.appId === oldAppId);
			const newEntry = updateResponse.body.visitor.externalIds.find((e: { appId: string }) => e.appId === app.id);

			expect(oldEntry).to.exist;
			expect(oldEntry.entityId).to.equal(entityId);
			expect(newEntry).to.exist;
			expect(newEntry.entityId).to.equal(entityId);
			expect(newEntry.metadata.username).to.equal('@newversion');
		});
	});
});
