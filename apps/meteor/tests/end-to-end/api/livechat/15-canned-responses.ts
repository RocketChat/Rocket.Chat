/* eslint-env mocha */

import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createCannedResponse } from '../../../data/livechat/canned-responses';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Canned responses', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('canned-responses.get', () => {
		it('should throw unauthorized when view-canned-responses permission is not set', async () => {
			await updatePermission('view-canned-responses', []);
			return request.get(api('canned-responses.get')).set(credentials).expect(403);
		});
		it('should return an array of canned responses when available', async () => {
			await updatePermission('view-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
			await createCannedResponse();
			const { body } = await request.get(api('canned-responses.get')).set(credentials).expect(200);
			expect(body).to.have.property('success', true);
			expect(body.responses).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.responses[0]).to.have.property('_id');
			expect(body.responses[0]).to.have.property('shortcut');
			expect(body.responses[0]).to.have.property('scope');
			expect(body.responses[0]).to.have.property('tags');
			expect(body.responses[0]).to.have.property('text');
			expect(body.responses[0]).to.have.property('userId');
		});
	});

	describe('[GET] canned-responses', () => {
		it('should fail if user dont have view-canned-responses permission', async () => {
			await updatePermission('view-canned-responses', []);
			return request.get(api('canned-responses')).set(credentials).expect(403);
		});
		it('should return an array of canned responses when available', async () => {
			await updatePermission('view-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
			await createCannedResponse();
			const { body } = await request.get(api('canned-responses')).set(credentials).expect(200);
			expect(body).to.have.property('success', true);
			expect(body.cannedResponses).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.cannedResponses[0]).to.have.property('_id');
			expect(body.cannedResponses[0]).to.have.property('shortcut');
			expect(body.cannedResponses[0]).to.have.property('scope');
			expect(body.cannedResponses[0]).to.have.property('tags');
			expect(body.cannedResponses[0]).to.have.property('text');
			expect(body.cannedResponses[0]).to.have.property('userId');
		});
		it('should return a canned response matching the params provided (shortcut)', async () => {
			const response = await createCannedResponse();
			const { body } = await request.get(api('canned-responses')).set(credentials).query({ shortcut: response.shortcut }).expect(200);
			expect(body).to.have.property('success', true);
			expect(body.cannedResponses).to.be.an('array').with.lengthOf(1);
			expect(body.cannedResponses[0]).to.have.property('_id');
			expect(body.cannedResponses[0]).to.have.property('shortcut', response.shortcut);
		});
		it('should return a canned response matching the params provided (scope)', async () => {
			const response = await createCannedResponse();
			const { body } = await request.get(api('canned-responses')).set(credentials).query({ scope: response.scope }).expect(200);
			expect(body).to.have.property('success', true);
			expect(body.cannedResponses).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.cannedResponses[0]).to.have.property('_id');
			expect(body.cannedResponses[0]).to.have.property('scope', response.scope);
		});
		it('should return a canned response matching the params provided (tags)', async () => {
			const response = await createCannedResponse();
			const { body } = await request.get(api('canned-responses')).set(credentials).query({ 'tags[]': response.tags[0] }).expect(200);
			expect(body).to.have.property('success', true);
			expect(body.cannedResponses).to.be.an('array').with.lengthOf(1);
			expect(body.cannedResponses[0]).to.have.property('_id');
			expect(body.cannedResponses[0]).to.have.property('tags').that.is.an('array').which.includes(response.tags[0]);
		});
		it('should return a canned response matching the params provided (text)', async () => {
			const response = await createCannedResponse();
			const { body } = await request.get(api('canned-responses')).set(credentials).query({ text: response.text }).expect(200);
			expect(body).to.have.property('success', true);
			expect(body.cannedResponses).to.be.an('array').with.lengthOf(1);
			expect(body.cannedResponses[0]).to.have.property('_id');
			expect(body.cannedResponses[0]).to.have.property('text', response.text);
		});
	});

	describe('[POST] canned-responses', () => {
		it('should fail if user dont have save-canned-responses permission', async () => {
			await updatePermission('save-canned-responses', []);
			return request
				.post(api('canned-responses'))
				.set(credentials)
				.send({ shortcut: 'shortcut', scope: 'user', tags: ['tag'], text: 'text' })
				.expect(403);
		});
		it('should fail if shortcut is not on the request', async () => {
			await updatePermission('save-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
			return request.post(api('canned-responses')).set(credentials).expect(400);
		});
		it('should fail if text is not on the request', async () => {
			return request.post(api('canned-responses')).set(credentials).send({ shortcut: 'shortcut' }).expect(400);
		});
		it('should fail if scope is not on the request', async () => {
			return request.post(api('canned-responses')).set(credentials).send({ shortcut: 'shortcut', text: 'text' }).expect(400);
		});
		it('should fail if tags is not an array of strings', async () => {
			return request
				.post(api('canned-responses'))
				.set(credentials)
				.send({ shortcut: 'shortcut', text: 'text', scope: 'department', tags: 'tag' })
				.expect(400);
		});
		it('should create a new canned response', async () => {
			const { body } = await request
				.post(api('canned-responses'))
				.set(credentials)
				.send({ shortcut: 'shortcutxx', scope: 'user', tags: ['tag'], text: 'text' })
				.expect(200);
			expect(body).to.have.property('success', true);
		});
		it('should fail if shortcut is already in use', async () => {
			return request
				.post(api('canned-responses'))
				.set(credentials)
				.send({ shortcut: 'shortcutxx', scope: 'user', tags: ['tag'], text: 'text' })
				.expect(400);
		});
	});

	describe('[DELETE] canned-responses', () => {
		it('should fail if user dont have remove-canned-responses permission', async () => {
			await updatePermission('remove-canned-responses', []);
			return request.delete(api('canned-responses')).send({ _id: 'sfdads' }).set(credentials).expect(403);
		});
		it('should fail if _id is not on the request', async () => {
			await updatePermission('remove-canned-responses', ['livechat-agent', 'livechat-monitor', 'livechat-manager', 'admin']);
			return request.delete(api('canned-responses')).set(credentials).expect(400);
		});
		it('should delete a canned response', async () => {
			const response = await createCannedResponse();
			const { body: cr } = await request.get(api('canned-responses')).set(credentials).query({ shortcut: response.shortcut }).expect(200);
			const { body } = await request.delete(api('canned-responses')).send({ _id: cr.cannedResponses[0]._id }).set(credentials).expect(200);
			expect(body).to.have.property('success', true);
		});
	});
});
