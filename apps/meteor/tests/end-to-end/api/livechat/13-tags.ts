import type { ILivechatDepartment, ILivechatTag } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartmentWithAnOnlineAgent } from '../../../data/livechat/department';
import { removeTag, saveTags } from '../../../data/livechat/tags';
import { createMonitor, createUnit } from '../../../data/livechat/units';
import { removePermissionFromAllRoles, restorePermissionToRoles, updatePermission, updateSetting } from '../../../data/permissions.helper';
import type { IUserWithCredentials } from '../../../data/user';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] Livechat - Tags', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('livechat/tags', () => {
		let tagsData: {
			caseA: { department: ILivechatDepartment; tag: ILivechatTag; agent: IUserWithCredentials };
			caseB: { department: ILivechatDepartment; tag: ILivechatTag; agent: IUserWithCredentials };
			casePublic: { tag: ILivechatTag };
		};
		let monitor: IUserWithCredentials;

		before(async () => {
			// create monitor
			const monitorUser = await createUser();
			const monitorCredentials = await login(monitorUser.username, password);
			await createMonitor(monitorUser.username);
			monitor = {
				user: monitorUser,
				credentials: monitorCredentials,
			};

			// remove all existing tags
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

			// should add 3 tags
			const { department: dA, agent: agentA } = await createDepartmentWithAnOnlineAgent();
			const tagA = await saveTags([dA._id]);
			const { department: dB, agent: agentB } = await createDepartmentWithAnOnlineAgent();
			const tagB = await saveTags([dB._id]);
			const publicTag = await saveTags();
			tagsData = {
				caseA: { department: dA, tag: tagA, agent: agentA },
				caseB: { department: dB, tag: tagB, agent: agentB },
				casePublic: { tag: publicTag },
			};
		});

		after(async () => {
			await deleteUser(monitor);
		});

		it('should throw unauthorized error when the user does not have the necessary permission', async () => {
			await removePermissionFromAllRoles('manage-livechat-tags');
			await removePermissionFromAllRoles('view-l-room');
			const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(403);
			expect(response.body).to.have.property('success', false);

			await restorePermissionToRoles('manage-livechat-tags');
			await restorePermissionToRoles('view-l-room');
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
		it('[Manager role] show return all tags when "viewAll" param is true and user has access to all tags', async () => {
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
		it('[Monitor role] show return only public tags when "viewAll" param is true and user does not have access to all tags', async () => {
			const response = await request
				.get(api('livechat/tags'))
				.set(monitor.credentials)
				.query({ viewAll: 'true' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(1);

			const expectedTags = [tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('[Manager Role] should return department tags and public tags when "departmentId" param is provided', async () => {
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
		it('[Manager role] should return public tags when "departmentId" param is not provided', async () => {
			const response = await request.get(api('livechat/tags')).set(credentials).expect('Content-Type', 'application/json').expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(1);
			expect(response.body.tags[0]).to.have.property('_id', tagsData.casePublic.tag._id);
		});
		it('[Monitor role] should return only public tags when user does not have access to department', async () => {
			const { department } = tagsData.caseA;

			const response = await request
				.get(api('livechat/tags'))
				.set(monitor.credentials)
				.query({ department: department._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(1);

			const expectedTags = [tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('[Monitor Role] should return department tags and public tags when "departmentId" param is provided', async () => {
			const { department } = tagsData.caseA;

			await createUnit(monitor.user._id, monitor.user.username || '', [department._id]);

			const response = await request
				.get(api('livechat/tags'))
				.set(monitor.credentials)
				.query({ department: department._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(2);

			const expectedTags = [tagsData.caseA.tag, tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('[Agent Role] should return department tags and public tags when "departmentId" param is provided', async () => {
			const { department, agent } = tagsData.caseA;

			const response = await request
				.get(api('livechat/tags'))
				.set(agent.credentials)
				.query({ department: department._id })
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(2);

			const expectedTags = [tagsData.caseA.tag, tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('[Monitor role] should return public tags and department tags which they are part of, when "departmentId" param is not provided', async () => {
			const response = await request
				.get(api('livechat/tags'))
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(2);
			const expectedTags = [tagsData.caseA.tag, tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
		});
		it('[Agent role] should return public tags when "departmentId" param is not provided', async () => {
			const response = await request
				.get(api('livechat/tags'))
				.set(monitor.credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(response.body).to.have.property('success', true);
			expect(response.body.tags).to.be.an('array').with.lengthOf(2);
			const expectedTags = [tagsData.caseA.tag, tagsData.casePublic.tag].map((tag) => tag._id).sort();
			const actualTags = response.body.tags.map((tag: ILivechatTag) => tag._id).sort();
			expect(actualTags).to.deep.equal(expectedTags);
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
