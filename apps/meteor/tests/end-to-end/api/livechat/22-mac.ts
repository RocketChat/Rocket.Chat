import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { api, getCredentials, request, credentials } from '../../../data/api-data';
import {
	createVisitor,
	createLivechatRoom,
	createAgent,
	makeAgentAvailable,
	sendAgentMessage,
	getLivechatRoomInfo,
} from '../../../data/livechat/rooms';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('MAC', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await createAgent();
		await makeAgentAvailable();
	});

	describe('MAC rooms', () => {
		it('Should create an innactive room by default', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			expect(room).to.be.an('object');
			expect(room.v.activity).to.be.undefined;
		});

		it('should mark room as active when agent sends a message', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await sendAgentMessage(room._id);

			const updatedRoom = await getLivechatRoomInfo(room._id);

			expect(updatedRoom).to.have.nested.property('v.activity').and.to.be.an('array');
		});
	});

	describe('MAC check', () => {
		it('should return `onLimit: true` when MAC limit has not been reached', async () => {
			const { body } = await request.get(api('omnichannel/mac/check')).set(credentials).expect(200);

			expect(body).to.have.property('onLimit', true);
		});
	});
});
