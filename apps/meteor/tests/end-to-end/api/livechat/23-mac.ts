import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import moment from 'moment';

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
		let visitor: ILivechatVisitor;
		it('Should create an innactive room by default', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			expect(room).to.be.an('object');
			expect(room.v.activity).to.be.undefined;
		});

		it('should mark room as active when agent sends a message', async () => {
			visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			await sendAgentMessage(room._id);

			const updatedRoom = await getLivechatRoomInfo(room._id);

			expect(updatedRoom).to.have.nested.property('v.activity').and.to.be.an('array');
		});

		it('should mark multiple rooms as active when they come from same visitor', async () => {
			const room = await createLivechatRoom(visitor.token);

			await sendAgentMessage(room._id);

			const updatedRoom = await getLivechatRoomInfo(room._id);

			expect(updatedRoom).to.have.nested.property('v.activity').and.to.be.an('array');
		});

		it('visitor should be marked as active for period', async () => {
			const { body } = await request
				.get(api(`livechat/visitors.info?visitorId=${visitor._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(body).to.have.nested.property('visitor').and.to.be.an('object');
			expect(body.visitor).to.have.nested.property('activity').and.to.be.an('array');
			expect(body.visitor.activity).to.have.lengthOf(1);
			expect(body.visitor.activity[0]).to.equal(moment.utc().format('YYYY-MM'));
		});
	});

	describe('MAC check', () => {
		it('should return `onLimit: true` when MAC limit has not been reached', async () => {
			const { body } = await request.get(api('omnichannel/mac/check')).set(credentials).expect(200);

			expect(body).to.have.property('onLimit', true);
		});
	});
});
