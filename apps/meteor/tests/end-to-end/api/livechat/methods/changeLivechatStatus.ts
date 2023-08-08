import type { ILivechatAgent, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, credentials, methodCall } from '../../../../data/api-data';
import { disableDefaultBusinessHour, makeDefaultBusinessHourActiveAndClosed } from '../../../../data/livechat/businessHours';
import { createAgent } from '../../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../../data/permissions.helper';
import { password } from '../../../../data/user';
import { createUser, deleteUser, getMe, login } from '../../../../data/users.helper';

describe('livechat:changeLivechatStatus', function () {
	this.retries(0);

	let agent: { user: IUser; credentials: { 'X-Auth-Token': string; 'X-User-Id': string } };

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);

		const user: IUser = await createUser();
		const userCredentials = await login(user.username, password);
		await createAgent(user.username);

		agent = {
			user,
			credentials: userCredentials,
		};
	});

	after(async () => {
		await deleteUser(agent.user);
	});

	describe('changeLivechatStatus', () => {
		// eslint-disable-next-line no-restricted-properties
		it('should return an "unauthorized error" when the user does not have the necessary permission to change other status', async () => {
			await updatePermission('manage-livechat-agents', []);
			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: 'not-available', agentId: agent.user._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody.error).to.have.property('error', 'error-not-allowed');
				});

			await updatePermission('manage-livechat-agents', ['admin']);
		});
		it('should return an error if user is not an agent', async () => {
			const user: IUser = await createUser();
			const userCredentials = await login(user.username, password);
			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(userCredentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: 'available', agentId: user._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody.error).to.have.property('error', 'error-not-allowed');
					expect(parsedBody.error).to.have.property('reason', 'Invalid Agent Id');
				});

			// cleanup
			await deleteUser(user);
		});
		it('should return an error if status is not valid', async () => {
			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(agent.credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: 'invalid-status', agentId: agent.user._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody.error).to.have.property('error', 'error-not-allowed');
					expect(parsedBody.error).to.have.property('reason', 'Invalid Status');
				});
		});
		it('should return an error if agentId param is not valid', async () => {
			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(agent.credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: 'available', agentId: 'invalid-agent-id' }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody.error).to.have.property('error', 'error-not-allowed');
					expect(parsedBody.error).to.have.property('reason', 'Invalid Agent Id');
				});
		});
		it('should change logged in users status', async () => {
			const currentUser: ILivechatAgent = await getMe(agent.credentials as any);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(agent.credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: newStatus, agentId: currentUser._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.not.have.property('error');
				});
		});
		it('should allow managers to change other agents status', async () => {
			await updatePermission('manage-livechat-agents', ['admin']);

			const currentUser: ILivechatAgent = await getMe(agent.credentials as any);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: newStatus, agentId: currentUser._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.not.have.property('error');
				});
		});
		it('should throw an error if agent tries to make themselves available outside of Business hour', async () => {
			await makeDefaultBusinessHourActiveAndClosed();

			const currentUser: ILivechatAgent = await getMe(agent.credentials as any);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(agent.credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: newStatus, agentId: currentUser._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody.error).to.have.property('error', 'error-business-hours-are-closed');
				});
		});
		it('should allow managers to make other agents available outside business hour', async () => {
			await updatePermission('manage-livechat-agents', ['admin']);

			const currentUser: ILivechatAgent = await getMe(agent.credentials as any);
			const currentStatus = currentUser.statusLivechat;
			const newStatus = currentStatus === 'available' ? 'not-available' : 'available';

			await request
				.post(methodCall('livechat:changeLivechatStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'livechat:changeLivechatStatus',
						params: [{ status: newStatus, agentId: currentUser._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.not.have.property('error');
				});

			await disableDefaultBusinessHour();
		});
	});
});
