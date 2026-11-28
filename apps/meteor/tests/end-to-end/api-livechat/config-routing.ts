import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const queueBasedConfig = {
	previewRoom: true,
	showConnecting: true,
	showQueue: true,
	showQueueLink: false,
	returnQueue: true,
	enableTriggerAction: false,
	autoAssignAgent: false,
};

const autoAssignConfig = {
	previewRoom: false,
	showConnecting: false,
	showQueue: false,
	showQueueLink: false,
	returnQueue: false,
	enableTriggerAction: true,
	autoAssignAgent: true,
};

const getRoutingConfig = (userCredentials: Credentials = credentials) =>
	request.get(api('livechat/config/routing')).set(userCredentials).expect('Content-Type', 'application/json');

describe('LIVECHAT - config/routing', () => {
	let previousRoutingMethod: string;
	let previousLivechatEnabled: boolean;

	before((_t, done) => getCredentials(done));

	before(async () => {
		previousRoutingMethod = (await getSettingValueById('Livechat_Routing_Method')) as string;
		previousLivechatEnabled = (await getSettingValueById('Livechat_enabled')) as boolean;
		await updateSetting('Livechat_enabled', true);
	});

	after(async () => {
		await updateSetting('Livechat_Routing_Method', previousRoutingMethod);
		await updateSetting('Livechat_enabled', previousLivechatEnabled);
	});

	describe('Authentication', () => {
		let user: IUser;
		let userCredentials: Credentials;

		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			user = await createUser();
			userCredentials = await login(user.username, password);
		});

		after(async () => {
			await deleteUser(user);
		});

		it('should return an "unauthenticated error" when the user is not logged in', async () => {
			await request.get(api('livechat/config/routing')).expect('Content-Type', 'application/json').expect(401);
		});

		it('should return the routing config to a logged-in user who is not an agent', async () => {
			const res = await getRoutingConfig(userCredentials).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.config).to.deep.equal(queueBasedConfig);
		});
	});

	describe('Routing methods', () => {
		it('should return the Manual_Selection config', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');

			const res = await getRoutingConfig().expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.config).to.deep.equal(queueBasedConfig);
		});

		it('should return the Auto_Selection config', async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');

			const res = await getRoutingConfig().expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.config).to.deep.equal({ ...autoAssignConfig, showQueueLink: true });
		});

		it('should return the External config', async () => {
			await updateSetting('Livechat_Routing_Method', 'External');

			const res = await getRoutingConfig().expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.config).to.deep.equal(autoAssignConfig);
		});

		it('should follow the routing method setting when it changes', async () => {
			await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
			const manual = await getRoutingConfig().expect(200);

			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
			const auto = await getRoutingConfig().expect(200);

			expect(manual.body.config).to.have.property('showQueue', true);
			expect(auto.body.config).to.have.property('showQueue', false);
			expect(auto.body.config).to.have.property('autoAssignAgent', true);
		});

		(IS_EE ? it : it.skip)('should return the Load_Balancing config', async () => {
			await updateSetting('Livechat_Routing_Method', 'Load_Balancing');

			const res = await getRoutingConfig().expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.config).to.deep.equal(autoAssignConfig);
		});

		(IS_EE ? it : it.skip)('should return the Load_Rotation config', async () => {
			await updateSetting('Livechat_Routing_Method', 'Load_Rotation');

			const res = await getRoutingConfig().expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body.config).to.deep.equal(autoAssignConfig);
		});
	});
});
