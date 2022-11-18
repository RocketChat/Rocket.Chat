/* eslint-env mocha */

import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createTrigger, fetchTriggers } from '../../../data/livechat/triggers';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - triggers', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/triggers', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request.get(api('livechat/triggers')).set(credentials).expect('Content-Type', 'application/json').expect(403).end(done);
			});
		});
		it('should return an array of triggers', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createTrigger(`test${Date.now()}`))
				.then(() => {
					request
						.get(api('livechat/triggers'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.triggers).to.be.an('array');
							expect(res.body).to.have.property('count').to.be.greaterThan(0);
							expect(res.body.triggers[0]).to.have.property('_id');
							expect(res.body.triggers[0]).to.have.property('name');
							expect(res.body.triggers[0]).to.have.property('description');
							expect(res.body.triggers[0]).to.have.property('enabled', true);
							expect(res.body.triggers[0]).to.have.property('runOnce').that.is.a('boolean');
							expect(res.body.triggers[0]).to.have.property('conditions').that.is.an('array').with.lengthOf.greaterThan(0);
							expect(res.body.triggers[0]).to.have.property('actions').that.is.an('array').with.lengthOf.greaterThan(0);
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
						})
						.end(done);
				});
		});
	});

	describe('livechat/triggers/:id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/triggers/invalid-id'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(() => updatePermission('view-livechat-manager', ['admin']).then(done));
			});
		});
		it('should return null when trigger does not exist', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/triggers/invalid-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.trigger).to.be.null;
		});
		it('should return the trigger', async () => {
			const triggerName = `test${Date.now()}`;
			await createTrigger(triggerName);
			const trigger = (await fetchTriggers()).find((t) => t.name === triggerName);
			const response = await request
				.get(api(`livechat/triggers/${trigger?._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.trigger).to.be.an('object');
			expect(response.body.trigger).to.have.property('_id', trigger?._id);
		});
	});
});
