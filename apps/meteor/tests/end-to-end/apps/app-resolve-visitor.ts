import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appExternalIdTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps } from '../../data/apps/helper';
import { createVisitor, createAgent, makeAgentAvailable } from '../../data/livechat/rooms';
import { updateSetting } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

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
		externalId: { userId: string; username?: string },
		contactData?: { phone?: string; email?: string },
	) => {
		return request
			.post(apps(`/public/${app.id}/resolve-visitor`))
			.set(credentials)
			.send({ externalId, phone: contactData?.phone, email: contactData?.email });
	};

	describe('externalId lookup', () => {
		it('should return null when externalId does not exist', async () => {
			const response = await callResolveVisitor({ userId: 'nonexistent-id' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});

		it('should find visitor directly by externalId', async () => {
			const phone = `+1${Date.now()}`;
			const visitor = await createVisitor(undefined, undefined, undefined, phone);

			const externalId = { userId: `id-${Date.now()}`, username: '@user' };
			await callResolveVisitor(externalId, { phone });

			const response = await callResolveVisitor(externalId);

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const appExternalId = response.body.visitor.externalIds.find((e: { source: string }) => e.source === app.id);
			expect(appExternalId.userId).to.equal(externalId.userId);
			expect(appExternalId.username).to.equal(externalId.username);
		});

		it('should not update externalId when found by lookup', async () => {
			const phone = `+2${Date.now()}`;
			await createVisitor(undefined, undefined, undefined, phone);

			const externalId = { userId: `id-${Date.now()}`, username: '@original' };
			await callResolveVisitor(externalId, { phone });

			// resolveVisitor is for resolving/enriching visitors, not for updating existing data.
			// When found by externalId, it returns the visitor as-is without modifications.
			// To update visitor data, apps should use other methods like ILivechatUpdater.
			const response = await callResolveVisitor({ userId: externalId.userId, username: '@changed' });

			const appExternalId = response.body.visitor.externalIds.find((e: { source: string }) => e.source === app.id);
			expect(appExternalId.username).to.equal('@original');
		});
	});

	describe('phone fallback', () => {
		it('should find visitor by phone and save externalId', async () => {
			const phone = `+3${Date.now()}`;
			const visitor = await createVisitor(undefined, undefined, undefined, phone);

			const externalId = { userId: `id-${Date.now()}`, username: '@user' };
			const response = await callResolveVisitor(externalId, { phone });

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const appExternalId = response.body.visitor.externalIds.find((e: { source: string }) => e.source === app.id);
			expect(appExternalId.userId).to.equal(externalId.userId);
			expect(appExternalId.username).to.equal(externalId.username);
		});

		it('should overwrite externalId when called with different userId', async () => {
			const phone = `+4${Date.now()}`;
			await createVisitor(undefined, undefined, undefined, phone);

			await callResolveVisitor({ userId: `first-${Date.now()}`, username: '@first' }, { phone });

			const newExternalId = { userId: `second-${Date.now()}`, username: '@second' };
			const response = await callResolveVisitor(newExternalId, { phone });

			const appExternalId = response.body.visitor.externalIds.find((e: { source: string }) => e.source === app.id);
			expect(appExternalId.userId).to.equal(newExternalId.userId);
			expect(appExternalId.username).to.equal('@second');
		});

		it('should return null when phone not found', async () => {
			const response = await callResolveVisitor({ userId: `id-${Date.now()}` }, { phone: '+0000000000' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});

		it('should not use phone fallback when phone is empty', async () => {
			const response = await callResolveVisitor({ userId: `id-${Date.now()}` }, { phone: '' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});
	});

	describe('email fallback', () => {
		it('should find visitor by email and save externalId', async () => {
			const email = `test-${Date.now()}@example.com`;
			const visitor = await createVisitor(undefined, undefined, email);

			const externalId = { userId: `id-email-${Date.now()}`, username: '@emailuser' };
			const response = await callResolveVisitor(externalId, { email });

			expect(response.status).to.equal(200);
			expect(response.body.visitor.id).to.equal(visitor._id);
			const appExternalId = response.body.visitor.externalIds.find((e: { source: string }) => e.source === app.id);
			expect(appExternalId.userId).to.equal(externalId.userId);
			expect(appExternalId.username).to.equal(externalId.username);
		});

		it('should overwrite externalId when called with different userId via email', async () => {
			const email = `test-${Date.now()}@example.com`;
			await createVisitor(undefined, undefined, email);

			await callResolveVisitor({ userId: `first-email-${Date.now()}`, username: '@first' }, { email });

			const newExternalId = { userId: `second-email-${Date.now()}`, username: '@second' };
			const response = await callResolveVisitor(newExternalId, { email });

			const appExternalId = response.body.visitor.externalIds.find((e: { source: string }) => e.source === app.id);
			expect(appExternalId.userId).to.equal(newExternalId.userId);
			expect(appExternalId.username).to.equal('@second');
		});

		it('should return null when email not found', async () => {
			const response = await callResolveVisitor({ userId: `id-${Date.now()}` }, { email: 'notfound@example.com' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});

		it('should not use email fallback when email is empty', async () => {
			const response = await callResolveVisitor({ userId: `id-${Date.now()}` }, { email: '' });

			expect(response.status).to.equal(200);
			expect(response.body.visitor).to.be.null;
		});
	});
});
