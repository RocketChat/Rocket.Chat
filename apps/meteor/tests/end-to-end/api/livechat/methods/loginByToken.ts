import type { ILivechatAgent, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, methodCallAnon, credentials } from '../../../../data/api-data';
import {
	closeOmnichannelRoom,
	createAgent,
	makeAgentAvailable,
	sendMessage,
	startANewLivechatRoomAndTakeIt,
} from '../../../../data/livechat/rooms';
import { removeAgent } from '../../../../data/livechat/users';
import { updateSetting } from '../../../../data/permissions.helper';
import { adminUsername } from '../../../../data/user';

describe('livechat:loginByTokens', function () {
	let visitor: ILivechatVisitor;
	let agent: ILivechatAgent;
	let room: IOmnichannelRoom;

	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		agent = await createAgent(adminUsername);
		await makeAgentAvailable(credentials);
	});

	before('open livechat room', async () => {
		const data = await startANewLivechatRoomAndTakeIt();
		visitor = data.visitor;
		room = data.room;
		await sendMessage(data.room._id, 'Hello from visitor!', visitor.token);
	});

	after('remove agent and close room', async () => {
		await closeOmnichannelRoom(room._id);
		await removeAgent(agent._id);
	});

	describe('loginByTokens', async () => {
		it('prevent getting arbitrary visitor id using regex in params', async () => {
			await request
				.post(methodCallAnon('livechat:loginByToken'))
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: 'id1',
						method: 'livechat:loginByToken',
						params: [{ $regex: `.*` }],
					}),
				})
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody).to.not.have.property('result');
				});
		});
	});
});
