import type { ILivechatAgent } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, methodCallAnon, credentials } from '../../../../data/api-data';
import { createAgent, makeAgentAvailable, sendMessage, startANewLivechatRoomAndTakeIt } from '../../../../data/livechat/rooms';
import { removeAgent } from '../../../../data/livechat/users';
import { updateSetting } from '../../../../data/permissions.helper';
import { adminUsername } from '../../../../data/user';

describe('livechat:loadHistory', function () {
	this.retries(0);
	let agent: ILivechatAgent;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		agent = await createAgent(adminUsername);
		await makeAgentAvailable(credentials);
	});

	after('remove agent', async () => {
		await removeAgent(agent._id);
	});

	describe('loadHistory', async () => {
		it('prevent getting unrelated message history using regex on rid param', async () => {
			const {
				room: { _id: roomId },
				visitor: { token },
			} = await startANewLivechatRoomAndTakeIt();

			await sendMessage(roomId, 'Hello from visitor', token);

			await request
				.post(methodCallAnon('livechat:loadHistory'))
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: 'id2',
						method: 'livechat:loadHistory',
						params: [
							{
								token,
								rid: { $regex: '.*' },
							},
						],
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
