/* eslint-disable no-restricted-properties */
/* eslint-env mocha */

import type { ILivechatAgent, ILivechatBusinessHour, ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatBusinessHourBehaviors, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import {
	getDefaultBusinessHour,
	removeAllCustomBusinessHours,
	saveBusinessHour,
	openOrCloseBusinessHour,
	createCustomBusinessHour,
	getCustomBusinessHourById,
} from '../../../data/livechat/businessHours';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';
import {
	addOrRemoveAgentFromDepartment,
	archiveDepartment,
	createDepartmentWithAnOnlineAgent,
	getDepartmentById,
} from '../../../data/livechat/department';
import { deleteUser, getMe } from '../../../data/users.helper';
import { deleteDepartment } from '../../../data/livechat/rooms';

// TODO: In a separate PR, divide this file into 2 files, one for CE and one for EE
describe('LIVECHAT - business hours', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
	});

	describe('[CE] livechat/business-hour', () => {
		it('should fail when user doesnt have view-livechat-business-hours permission', async () => {
			await updatePermission('view-livechat-business-hours', []);
			const response = await request.get(api('livechat/business-hour')).set(credentials).expect(403);
			expect(response.body.success).to.be.false;
		});
		it('should fail when business hour type is not a valid BH type', async () => {
			await updatePermission('view-livechat-business-hours', ['admin', 'livechat-manager']);
			const response = await request.get(api('livechat/business-hour')).set(credentials).query({ type: 'invalid' }).expect(200);
			expect(response.body.success).to.be.true;
			expect(response.body.businessHour).to.be.null;
		});
		it('should return a business hour of type default', async () => {
			const response = await request.get(api('livechat/business-hour')).set(credentials).query({ type: 'default' }).expect(200);
			expect(response.body.success).to.be.true;
			expect(response.body.businessHour).to.be.an('object');
			expect(response.body.businessHour._id).to.be.a('string');
			expect(response.body.businessHour.workHours).to.be.an('array');
			expect(response.body.businessHour.workHours[0]).to.be.an('object');
			expect(response.body.businessHour.workHours[0].day)
				.to.be.an('string')
				.that.is.oneOf(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
			expect(response.body.businessHour.workHours[0].start).to.be.an('object');
			expect(response.body.businessHour.workHours[0].finish).to.be.an('object');
			expect(response.body.businessHour.workHours[0].open).to.be.a('boolean');
			expect(response.body.businessHour.timezone).to.be.an('object').that.has.property('name').that.is.an('string');
		});
	});

	(IS_EE ? describe : describe.skip)('[EE] livechat/business-hour', () => {
		it('should fail if user doesnt have view-livechat-business-hours permission', async () => {
			await updatePermission('view-livechat-business-hours', []);
			const response = await request.get(api('livechat/business-hours')).set(credentials).expect(403);
			expect(response.body.success).to.be.false;
		});
		it('should return a list of business hours', async () => {
			await updatePermission('view-livechat-business-hours', ['admin', 'livechat-manager']);
			const response = await request.get(api('livechat/business-hours')).set(credentials).expect(200);
			expect(response.body.success).to.be.true;
			expect(response.body.businessHours).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(response.body.businessHours[0]).to.be.an('object');
			expect(response.body.businessHours[0]._id).to.be.a('string');
			expect(response.body.businessHours[0].workHours).to.be.an('array');
			expect(response.body.businessHours[0].workHours[0]).to.be.an('object');
			expect(response.body.businessHours[0].workHours[0].day)
				.to.be.an('string')
				.that.is.oneOf(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
			expect(response.body.businessHours[0].workHours[0].start).to.be.an('object');
			expect(response.body.businessHours[0].workHours[0].finish).to.be.an('object');
			expect(response.body.businessHours[0].workHours[0].open).to.be.a('boolean');
			expect(response.body.businessHours[0].timezone).to.be.an('object').that.has.property('name').that.is.an('string');
			expect(response.body.businessHours[0].active).to.be.a('boolean');
		});
		it('should return a just created custom business hour', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', 'multiple');
			await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '08:00',
						// @ts-expect-error - same as previous one
						finish: '18:00',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			const { body } = await request.get(api('livechat/business-hours')).set(credentials).query({ name }).expect(200);
			expect(body.success).to.be.true;
			expect(body.businessHours).to.be.an('array').with.lengthOf(1);
			expect(body.businessHours[0]).to.be.an('object');
			expect(body.businessHours[0]._id).to.be.a('string');
			expect(body.businessHours[0]).to.have.property('name', name);
			expect(body.businessHours[0]).to.have.property('active', true);
			expect(body.businessHours[0]).to.have.property('type', LivechatBusinessHourTypes.CUSTOM);
			expect(body.businessHours[0]).to.have.property('workHours').that.is.an('array').with.lengthOf(1);
			expect(body.businessHours[0].workHours[0]).to.be.an('object').with.property('day', 'Monday');
			expect(body.businessHours[0].workHours[0]).to.have.property('start').that.is.an('object');
			expect(body.businessHours[0].workHours[0]).to.have.property('finish').that.is.an('object');
			expect(body.businessHours[0]).to.have.property('timezone').that.is.an('object').with.property('name', 'America/Sao_Paulo');
		});
	});

	// Scenario: Assume we have a BH linked to a department, and we archive the department
	// Expected result:
	// 1) If BH is open and only linked to that department, it should be closed
	// 2) If BH is open and linked to other departments, it should remain open
	// 3) Agents within the archived department should be assigned to default BH
	// 3.1) We'll also need to handle the case where if an agent is assigned to "dep1"
	//  and "dep2" and both these depts are connected to same BH, then in this case after
	//  archiving "dep1", we'd still need to BH within this user's cache since he's part of
	//  "dep2" which is linked to BH
	// TODO: Write similar test for disabling a department
	(IS_EE ? describe : describe.skip)('[EE] BH operations post department archiving', () => {
		let defaultBusinessHour: ILivechatBusinessHour;
		let customBusinessHour: ILivechatBusinessHour;
		let deptLinkedToCustomBH: ILivechatDepartment;
		let agentLinkedToDept: Awaited<ReturnType<typeof createDepartmentWithAnOnlineAgent>>['agent'];

		this.beforeEach(async () => {
			await updateSetting('Livechat_business_hour_type', LivechatBusinessHourBehaviors.MULTIPLE);

			// cleanup any existing business hours
			await removeAllCustomBusinessHours();

			// get default business hour
			defaultBusinessHour = await getDefaultBusinessHour();

			// close default business hour
			await openOrCloseBusinessHour(defaultBusinessHour, false);

			// create custom business hour and link it to a department
			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			customBusinessHour = await createCustomBusinessHour([department._id]);
			agentLinkedToDept = agent;
			deptLinkedToCustomBH = department;

			// open custom business hour
			await openOrCloseBusinessHour(customBusinessHour, true);
		});

		it('upon archiving a department, if BH is open and only linked to that department, it should be closed', async () => {
			// archive department
			await archiveDepartment(deptLinkedToCustomBH._id);

			// verify if department is archived and BH link is removed
			const department = await getDepartmentById(deptLinkedToCustomBH._id);
			expect(department).to.be.an('object');
			expect(department.archived).to.be.true;
			expect(department.businessHourId).to.be.undefined;

			// verify if BH is closed
			const latestCustomBH = await getCustomBusinessHourById(customBusinessHour._id);
			expect(latestCustomBH).to.be.an('object');
			expect(latestCustomBH.active).to.be.false;
			expect(latestCustomBH.departments).to.be.an('array').that.is.empty;
		});

		it('upon archiving a department, if BH is open and linked to other departments, it should remain open', async () => {
			// create another department and link it to the same BH
			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			await removeAllCustomBusinessHours();
			customBusinessHour = await createCustomBusinessHour([deptLinkedToCustomBH._id, department._id]);

			// archive department
			await archiveDepartment(deptLinkedToCustomBH._id);

			// verify if department is archived and BH link is removed
			const archivedDepartment = await getDepartmentById(deptLinkedToCustomBH._id);
			expect(archivedDepartment).to.be.an('object');
			expect(archivedDepartment.archived).to.be.true;
			expect(archivedDepartment.businessHourId).to.be.undefined;
			// verify if other department is not archived and BH link is not removed
			const otherDepartment = await getDepartmentById(department._id);
			expect(otherDepartment).to.be.an('object');
			expect(otherDepartment.businessHourId).to.be.equal(customBusinessHour._id);

			// verify if BH is still open
			const latestCustomBH = await getCustomBusinessHourById(customBusinessHour._id);
			expect(latestCustomBH).to.be.an('object');
			expect(latestCustomBH.active).to.be.true;
			expect(latestCustomBH.departments).to.be.an('array').of.length(1);
			expect(latestCustomBH?.departments?.[0]._id).to.be.equal(department._id);

			// cleanup
			await deleteDepartment(department._id);
			await deleteUser(agent.user);
		});

		it('upon archiving a department, agents within the archived department should be assigned to default BH', async () => {
			await openOrCloseBusinessHour(defaultBusinessHour, true);

			// archive department
			await archiveDepartment(deptLinkedToCustomBH._id);

			const latestAgent: ILivechatAgent = await getMe(agentLinkedToDept.credentials as any);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.an('array').of.length(1);
			expect(latestAgent?.openBusinessHours?.[0]).to.be.equal(defaultBusinessHour._id);
		});

		it('upon archiving a department, overlapping agents should still have BH within their cache', async () => {
			// create another department and link it to the same BH
			const { department, agent } = await createDepartmentWithAnOnlineAgent();
			await removeAllCustomBusinessHours();
			customBusinessHour = await createCustomBusinessHour([deptLinkedToCustomBH._id, department._id]);

			// create overlapping agent by adding previous agent to newly created department
			await addOrRemoveAgentFromDepartment(
				department._id,
				{
					agentId: agentLinkedToDept.user._id,
					username: agentLinkedToDept.user.username || '',
				},
				true,
			);

			// archive department
			await archiveDepartment(deptLinkedToCustomBH._id);

			// verify if department is archived and BH link is removed
			const archivedDepartment = await getDepartmentById(deptLinkedToCustomBH._id);
			expect(archivedDepartment).to.be.an('object');
			expect(archivedDepartment.archived).to.be.true;
			expect(archivedDepartment.businessHourId).to.be.undefined;

			// verify if BH is still open
			const latestCustomBH = await getCustomBusinessHourById(customBusinessHour._id);
			expect(latestCustomBH).to.be.an('object');
			expect(latestCustomBH.active).to.be.true;
			expect(latestCustomBH.departments).to.be.an('array').of.length(1);
			expect(latestCustomBH?.departments?.[0]?._id).to.be.equal(department._id);

			// verify if overlapping agent still has BH within his cache
			const latestAgent: ILivechatAgent = await getMe(agentLinkedToDept.credentials as any);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.an('array').of.length(1);
			expect(latestAgent?.openBusinessHours?.[0]).to.be.equal(customBusinessHour._id);

			// verify if other agent still has BH within his cache
			const otherAgent: ILivechatAgent = await getMe(agent.credentials as any);
			expect(otherAgent).to.be.an('object');
			expect(otherAgent.openBusinessHours).to.be.an('array').of.length(1);
			expect(otherAgent?.openBusinessHours?.[0]).to.be.equal(customBusinessHour._id);

			// cleanup
			await deleteDepartment(department._id);
			await deleteUser(agent.user);
		});

		this.afterEach(async () => {
			await deleteDepartment(deptLinkedToCustomBH._id);
			await deleteUser(agentLinkedToDept.user);
		});
	});
});
