/* eslint-env mocha */

import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { saveTags } from '../../../data/livechat/tags';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] Livechat - Tags', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/tags', () => {
		it('should throw unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-tags', []);
			await updatePermission('view-l-room', []);
			const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of tags', async () => {
			await updatePermission('manage-livechat-tags', ['admin']);
			await updatePermission('view-l-room', ['livechat-agent']);
			const tag = await saveTags();
			const response = await request
				.get(api('livechat/tags'))
				.set(credentials)
				.query({ text: tag.name })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(response.body.tags[0]).to.have.property('_id', tag._id);
		});
	});

	describe('livechat/tags/:tagId', () => {
		it('should throw unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-tags', []);
			await updatePermission('view-l-room', []);
			const response = await request.get(api('livechat/tags/123')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return null when the tag does not exist', async () => {
			await updatePermission('manage-livechat-tags', ['admin']);
			await updatePermission('view-l-room', ['livechat-agent']);
			const response = await request.get(api('livechat/tags/123')).set(credentials).expect('Content-Type', 'application/json').expect(200);
			expect(response.body.body).to.be.null;
		});
		it('should return a tag', async () => {
			const tag = await saveTags();
			const response = await request
				.get(api(`livechat/tags/${tag._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('_id', tag._id);
			expect(response.body).to.have.property('name', tag.name);
			expect(response.body).to.have.property('numDepartments', 0);
		});
	});
});
