/* eslint-env mocha */

import type { ILivechatAgent, ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, LivechatBusinessHourBehaviors, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { saveBusinessHour } from '../../../data/livechat/business-hours';
import { updateEESetting, updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';
import { createUser, deleteUser, getMe, login } from '../../../data/users.helper';
import { createAgent, makeAgentAvailable } from '../../../data/livechat/rooms';
import { sleep } from '../../../../lib/utils/sleep';
import { getDefaultBusinessHour, openOrCloseBusinessHour, getWorkHours } from '../../../data/livechat/businessHours';
import type { IUserCredentialsHeader } from '../../../data/user';
import { password } from '../../../data/user';
import { removeAgent } from '../../../data/livechat/users';

describe('[CE] LIVECHAT - business hours', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_enable_business_hours', true);
		await createAgent();
	});

	let defaultBhId: any;
	describe('livechat/business-hour', () => {
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

			defaultBhId = response.body.businessHour;
		});
		it('should not allow a user to be available if BH are closed', async () => {
			await saveBusinessHour({
				...defaultBhId,
				workHours: [
					{
						day: 'Monday',
						open: true,
						start: '00:00',
						finish: '00:01',
					},
				],
			});

			const { body } = await makeAgentAvailable(credentials);

			expect(body).to.have.property('success', false);
			expect(body.error).to.be.equal('error-business-hours-are-closed');
		});
		it('should allow a user to be available if BH are open', async () => {
			await saveBusinessHour({
				...defaultBhId,
				workHours: getWorkHours(true),
			});

			const { body } = await makeAgentAvailable(credentials);

			expect(body).to.have.property('success', true);
		});
	});

	(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - business hours', () => {
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
			await updateSetting('Livechat_business_hour_type', LivechatBusinessHourBehaviors.MULTIPLE);
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
		it('should fail if start and finish time are the same', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', LivechatBusinessHourBehaviors.MULTIPLE);
			const result = await saveBusinessHour({
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
						finish: '08:00',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			expect(result).to.have.property('error');
		});
		it('should fail if finish is before start time', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', LivechatBusinessHourBehaviors.MULTIPLE);
			const result = await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '10:00',
						// @ts-expect-error - same as previous one
						finish: '08:00',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			expect(result).to.have.property('error');
		});
		it('should fail if data is invalid', async () => {
			const name = `business-hour-${Date.now()}`;
			await updateSetting('Livechat_business_hour_type', LivechatBusinessHourBehaviors.MULTIPLE);
			const result = await saveBusinessHour({
				name,
				active: true,
				type: LivechatBusinessHourTypes.CUSTOM,
				workHours: [
					{
						day: 'Monday',
						open: true,
						// @ts-expect-error - this is valid for endpoint, actual type converts this into an object
						start: '20000',
						// @ts-expect-error - same as previous one
						finish: 'xxxxx',
					},
				],
				timezone: {
					name: 'America/Sao_Paulo',
					utc: '-03:00',
				},
				departmentsToApplyBusinessHour: '',
				timezoneName: 'America/Sao_Paulo',
			});

			expect(result).to.have.property('error');
		});
	});

	describe('BH behavior upon new agent creation/deletion', () => {
		let defaultBH: ILivechatBusinessHour;
		let agent: ILivechatAgent;
		let agentCredentials: IUserCredentialsHeader;

		before(async () => {
			await updateSetting('Livechat_enable_business_hours', true);
			await updateEESetting('Livechat_business_hour_type', LivechatBusinessHourBehaviors.SINGLE);
			// wait for callbacks to run
			await sleep(2000);

			defaultBH = await getDefaultBusinessHour();
			await openOrCloseBusinessHour(defaultBH, true);

			agent = await createUser();
			agentCredentials = await login(agent.username, password);
		});

		it('should create a new agent and verify if it is assigned to the default business hour which is open', async () => {
			agent = await createAgent(agent.username);

			const latestAgent: ILivechatAgent = await getMe(agentCredentials as any);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.an('array').of.length(1);
			expect(latestAgent?.openBusinessHours?.[0]).to.be.equal(defaultBH._id);
		});

		it('should create a new agent and verify if it is assigned to the default business hour which is closed', async () => {
			await openOrCloseBusinessHour(defaultBH, false);

			const newUser: ILivechatAgent = await createUser();
			const newUserCredentials = await login(newUser.username, password);
			await createAgent(newUser.username);

			const latestAgent: ILivechatAgent = await getMe(newUserCredentials);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.undefined;
			expect(latestAgent.statusLivechat).to.be.equal(ILivechatAgentStatus.NOT_AVAILABLE);
		});

		it('should verify if agent is assigned to BH when it is opened', async () => {
			// first verify if agent is not assigned to any BH
			let latestAgent: ILivechatAgent = await getMe(agentCredentials as any);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.an('array').of.length(0);
			expect(latestAgent.statusLivechat).to.be.equal(ILivechatAgentStatus.NOT_AVAILABLE);

			// now open BH
			await openOrCloseBusinessHour(defaultBH, true);

			// verify if agent is assigned to BH
			latestAgent = await getMe(agentCredentials as any);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.an('array').of.length(1);
			expect(latestAgent?.openBusinessHours?.[0]).to.be.equal(defaultBH._id);

			// verify if agent is able to make themselves available
			await makeAgentAvailable(agentCredentials as any);
		});

		it('should verify if BH related props are cleared when an agent is deleted', async () => {
			await removeAgent(agent._id);

			const latestAgent: ILivechatAgent = await getMe(agentCredentials as any);
			expect(latestAgent).to.be.an('object');
			expect(latestAgent.openBusinessHours).to.be.undefined;
			expect(latestAgent.statusLivechat).to.be.undefined;
		});

		after(async () => {
			await deleteUser(agent._id);
		});
	});
});
