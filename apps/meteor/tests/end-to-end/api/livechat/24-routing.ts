import type { ILivechatDepartment, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials } from '../../../data/api-data';
import {
	createAgent,
	makeAgentAvailable,
	createDepartment,
	createVisitor,
	createLivechatRoom,
	getLivechatRoomInfo,
	makeAgentUnavailable,
} from '../../../data/livechat/rooms';
import { sleep } from '../../../data/livechat/utils';
import { updateSetting } from '../../../data/permissions.helper';
import type { IUserCredentialsHeader } from '../../../data/user';
import { password } from '../../../data/user';
import { createUser, deleteUser, login } from '../../../data/users.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Omnichannel - Routing', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_Routing_Method', 'Auto_Selection');
	});

	let testUser: { user: IUser; credentials: IUserCredentialsHeader };
	let testUser2: { user: IUser; credentials: IUserCredentialsHeader };
	let testDepartment: ILivechatDepartment;

	before(async () => {
		const user = await createUser();
		await createAgent(user.username);
		const credentials2 = await login(user.username, password);
		await makeAgentAvailable(credentials2);

		testUser = {
			user,
			credentials: credentials2,
		};
	});

	before(async () => {
		const user = await createUser();
		await createAgent(user.username);
		const credentials2 = await login(user.username, password);
		await makeAgentUnavailable(credentials2);

		testUser2 = {
			user,
			credentials: credentials2,
		};
	});

	before(async () => {
		testDepartment = await createDepartment([{ agentId: testUser.user._id }]);
	});

	after(async () => {
		await deleteUser(testUser.user._id);
		await deleteUser(testUser2.user._id);
	});

	describe('Auto-Selection', () => {
		it('should route a room to an available agent', async () => {
			const visitor = await createVisitor(testDepartment._id);
			const room = await createLivechatRoom(visitor.token);

			await sleep(5000);

			const roomInfo = await getLivechatRoomInfo(room._id);

			expect(roomInfo.servedBy).to.be.an('object');
			expect(roomInfo.servedBy?._id).to.be.equal(testUser.user._id);
			expect(roomInfo.servedBy?._id).to.not.be.equal(testUser2.user._id);
		});
	});
});
