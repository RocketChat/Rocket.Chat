import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials, api } from '../../data/api-data';
import { APP_URL, apps } from '../../data/apps/apps-data';
import { cleanupApps } from '../../data/apps/helper';
import { updatePermission } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

describe('Apps - UIKit Interaction', () => {
	before((done) => getCredentials(done));

	before(async () => cleanupApps());

	after(() => Promise.all([cleanupApps(), updatePermission('manage-apps', ['admin'])]));

	let app: any;

	const disableApp = (req: typeof request) =>
		req
			.post(apps(`/${app.id}/status`))
			.set(credentials)
			.send({
				status: 'disabled',
			});

	describe('[UIKit Interaction]', () => {
		it('should successfully install two apps - one enabled and one disabled', (done) => {
			void updatePermission('manage-apps', ['admin']).then(() => {
				// Install first app (will be enabled in EE)
				void request
					.post(apps())
					.set(credentials)
					.send({
						url: APP_URL,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('app');
						app = res.body.app;
					})
					.end(done);
			});
		});

		describe('Block Actions', () => {
			it('should successfully process block action for enabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'blockAction',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						payload: { test: 'payload' },
						container: { type: 'message' },
					})
					// .expect('Content-Type', 'application/json')
					.expect(200)
					.end(done);
			});

			it('should reject block action for disabled app', (done) => {
				before((done) => disableApp(request).end(done));

				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'blockAction',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						payload: { test: 'payload' },
						container: { type: 'message' },
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('App is disabled');
					})
					.end(done);
			});
		});

		describe('View Submissions', () => {
			it('should successfully process view submission for enabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'viewSubmit',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						payload: { view: { id: 'test-view' } },
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});

			it('should reject view submission for disabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${disabledApp.id}`)
					.set(credentials)
					.send({
						type: 'viewSubmit',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						payload: { view: { id: 'test-view' } },
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('App is disabled');
					})
					.end(done);
			});
		});

		describe('View Closed', () => {
			it('should successfully process view closed for enabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'viewClosed',
						triggerId: 'test-trigger',
						payload: {
							view: { id: 'test-view' },
							isCleared: false,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});

			it('should reject view closed for disabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${disabledApp.id}`)
					.set(credentials)
					.send({
						type: 'viewClosed',
						triggerId: 'test-trigger',
						payload: {
							view: { id: 'test-view' },
							isCleared: false,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('App is disabled');
					})
					.end(done);
			});
		});

		describe('Action Buttons', () => {
			it('should successfully process action button for enabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'actionButton',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						rid: 'test-room',
						mid: 'test-message',
						payload: {
							context: 'test-context',
							message: 'test message',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});

			it('should reject action button for disabled app', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${disabledApp.id}`)
					.set(credentials)
					.send({
						type: 'actionButton',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						rid: 'test-room',
						mid: 'test-message',
						payload: {
							context: 'test-context',
							message: 'test message',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('App is disabled');
					})
					.end(done);
			});
		});

		describe('Authentication', () => {
			it('should reject interaction when user is not authenticated', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.send({
						type: 'blockAction',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						payload: { test: 'payload' },
					})
					.expect('Content-Type', 'application/json')
					.expect(401)
					.expect((res) => {
						expect(res.body).to.have.a.property('status', 'error');
						expect(res.body.message).to.be.equal('You must be logged in to do this.');
					})
					.end(done);
			});

			it('should accept interaction when visitor token is provided', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set('x-visitor-token', 'test-visitor-token')
					.send({
						type: 'blockAction',
						actionId: 'test-action',
						triggerId: 'test-trigger',
						payload: { test: 'payload' },
						visitor: {
							id: 'test-visitor',
							username: 'visitor',
							token: 'test-visitor-token',
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});
		});

		describe('Invalid Requests', () => {
			it('should reject unknown interaction type', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'unknownType',
						actionId: 'test-action',
						triggerId: 'test-trigger',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('error', 'Unknown action');
					})
					.end(done);
			});

			it('should reject request with missing required fields', (done) => {
				void request
					.post(`/api/apps/ui.interaction/${app.id}`)
					.set(credentials)
					.send({
						type: 'blockAction',
						// Missing actionId and triggerId
						payload: { test: 'payload' },
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end(done);
			});
		});
	});
});
