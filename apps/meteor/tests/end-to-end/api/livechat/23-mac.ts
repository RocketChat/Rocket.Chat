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
	fetchInquiry,
	closeOmnichannelRoom,
} from '../../../data/livechat/rooms';

describe('MAC', () => {
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

		it('should mark multiple rooms as active when they come from same visitor after an agent sends a message', async () => {
			const room = await createLivechatRoom(visitor.token);

			await sendAgentMessage(room._id);

			const updatedRoom = await getLivechatRoomInfo(room._id);

			expect(updatedRoom).to.have.nested.property('v.activity').and.to.be.an('array');

			await closeOmnichannelRoom(room._id);
		});

		it('should mark room as active when it comes from same visitor on same period, even without agent interaction', async () => {
			const room = await createLivechatRoom(visitor.token);

			expect(room).to.have.nested.property('v.activity').and.to.be.an('array');
			expect(room.v.activity?.includes(moment.utc().format('YYYY-MM'))).to.be.true;

			await closeOmnichannelRoom(room._id);
		});

		it('should mark an inquiry as active when it comes from same visitor on same period, even without agent interaction', async () => {
			const room = await createLivechatRoom(visitor.token);
			const inquiry = await fetchInquiry(room._id);

			expect(inquiry).to.have.nested.property('v.activity').and.to.be.an('array');
			expect(inquiry.v.activity?.includes(moment.utc().format('YYYY-MM'))).to.be.true;
			expect(room.v.activity?.includes(moment.utc().format('YYYY-MM'))).to.be.true;

			await closeOmnichannelRoom(room._id);
		});

		it('visitor should be marked as active for period', async () => {
			const { body } = await request
				.get(api(`livechat/visitors.info?visitorId=${visitor._id}`))
				.set(credentials)
				.success();

			expect(body).to.have.nested.property('visitor').and.to.be.an('object');
			expect(body.visitor).to.have.nested.property('activity').and.to.be.an('array');
			expect(body.visitor.activity).to.have.lengthOf(1);
			expect(body.visitor.activity[0]).to.equal(moment.utc().format('YYYY-MM'));
		});
	});
});
