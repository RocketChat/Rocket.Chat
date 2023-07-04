/* eslint-env mocha */

import { expect } from 'chai';
import type { ILivechatDepartment, ILivechatTag } from '@rocket.chat/core-typings';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { removeTag, saveTags } from '../../../data/livechat/tags';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';
import { createDepartment } from '../../../data/livechat/rooms';

(IS_EE ? describe : describe.skip)('[EE] Livechat - Tags', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('livechat/tags', () => {
		let tagsData: {
			caseA: { department: ILivechatDepartment; tag: ILivechatTag };
			caseB: { department: ILivechatDepartment; tag: ILivechatTag };
			casePublic: { tag: ILivechatTag };
		};
		it('should throw unauthorized error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-tags', []);
			await updatePermission('view-l-room', []);
			const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);

			await updatePermission('manage-livechat-tags', ['admin']);
			await updatePermission('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
		});
		it('should remove all existing tags', async () => {
			const allTags = await request
				.get(api('livechat/tags'))
				.set(credentials)
				.query({ viewAll: 'true' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			const { tags } = allTags.body;
			for await (const tag of tags) {
				await removeTag(tag._id);
			}

			const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body).to.have.property('tags').and.to.be.an('array').that.is.empty;
		});
		it('should add 3 tags', async () => {
			const dA = await createDepartment();
			const tagA = await saveTags([dA._id]);

			const dB = await createDepartment();
			const tagB = await saveTags([dB._id]);

			const publicTag = await saveTags();

			tagsData = {
				caseA: { department: dA, tag: tagA },
				caseB: { department: dB, tag: tagB },
				casePublic: { tag: publicTag },
			};
		});
		it('should return an array of tags', async () => {
			const { tag } = tagsData.caseA;
			const response = await request
				.get(api('livechat/tags'))
				.set(credentials)
				.query({ text: tag.name, viewAll: 'true' })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(1);
			expect(response.body.tags[0]).to.have.property('_id', tag._id);
		});
		it('show return all tags when "viewAll" param is true', async () => {
			const response = await request
				.get(api('livechat/tags'))
				.set(credentials)
				.query({ viewAll: 'true' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(3);

			const expectedTags = [tagsData.caseA.tag, tagsData.caseB.tag, tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('should return department tags and public tags when "departmentId" param is provided', async () => {
			const { department } = tagsData.caseA;

			const response = await request
				.get(api('livechat/tags'))
				.set(credentials)
				.query({ department: department._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(2);

			const expectedTags = [tagsData.caseA.tag, tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('should return public tags when "departmentId" param is not provided', async () => {
			const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(1);
			expect(response.body.tags[0]).to.have.property('_id', tagsData.casePublic.tag._id);
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
