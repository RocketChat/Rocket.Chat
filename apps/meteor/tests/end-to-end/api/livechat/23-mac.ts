import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, afterEach, after, describe, it } from 'mocha';
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
	deleteVisitor,
} from '../../../data/livechat/rooms';

describe('MAC', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await createAgent();
		await makeAgentAvailable();
	});

	describe('MAC rooms', () => {
		let visitor: ILivechatVisitor;
		let multipleContactsVisitor: ILivechatVisitor;
		let room: IOmnichannelRoom;

		afterEach(() => Promise.all([deleteVisitor(visitor.token), closeOmnichannelRoom(room._id)]));

		after(() => deleteVisitor(multipleContactsVisitor.token));

		it('Should create an innactive room and contact by default', async () => {
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);

			expect(room).to.be.an('object');
			expect(room.v.activity).to.be.undefined;
		});

		it('Should create an innactive contact by default', async () => {
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.v.contactId });
			expect(res.body.contact.channels[0].visitorId).to.be.equal(visitor._id);
			expect(res.body.contact).not.to.have.property('activity');
		});

		it('should mark room as active when agent sends a message', async () => {
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);

			await sendAgentMessage(room._id);

			const updatedRoom = await getLivechatRoomInfo(room._id);

			expect(updatedRoom).to.have.nested.property('v.activity').and.to.be.an('array');
		});

		it('should mark contact as active when agent sends a message', async () => {
			multipleContactsVisitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);

			await sendAgentMessage(room._id);

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.v.contactId });
			expect(res.body.contact.channels[0].visitorId).to.be.equal(visitor._id);
			expect(res.body.contact).to.have.property('activity').that.is.an('array').with.lengthOf(1);
			expect(res.body.contact.activity[0]).to.equal(moment.utc().format('YYYY-MM'));
		});

		it('should mark multiple rooms as active when they come from same contact after an agent sends a message', async () => {
			room = await createLivechatRoom(multipleContactsVisitor.token);

			await sendAgentMessage(room._id);

			const updatedRoom = await getLivechatRoomInfo(room._id);

			expect(updatedRoom).to.have.nested.property('v.activity').and.to.be.an('array');
		});

		it('should keep contact active when reusing it and an agent response is received', async () => {
			room = await createLivechatRoom(multipleContactsVisitor.token);

			await sendAgentMessage(room._id);

			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.v.contactId });
			expect(res.body.contact.channels[0].visitorId).to.be.equal(multipleContactsVisitor._id);
			expect(res.body.contact).to.have.property('activity').that.is.an('array').with.lengthOf(1);
			expect(res.body.contact.activity[0]).to.equal(moment.utc().format('YYYY-MM'));
		});

		it('should mark room as active when it comes from same contact on same period, even without agent interaction', async () => {
			room = await createLivechatRoom(multipleContactsVisitor.token);

			expect(room).to.have.nested.property('v.activity').and.to.be.an('array');
			expect(room.v.activity?.includes(moment.utc().format('YYYY-MM'))).to.be.true;
		});

		it('should mark an inquiry as active when it comes from same contact on same period, even without agent interaction', async () => {
			room = await createLivechatRoom(multipleContactsVisitor.token);
			const inquiry = await fetchInquiry(room._id);

			expect(inquiry).to.have.nested.property('v.activity').and.to.be.an('array');
			expect(inquiry.v.activity?.includes(moment.utc().format('YYYY-MM'))).to.be.true;
			expect(room.v.activity?.includes(moment.utc().format('YYYY-MM'))).to.be.true;
		});

		it('contact should be marked as active for period', async () => {
			visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);
			await sendAgentMessage(room._id);
			const res = await request.get(api(`omnichannel/contacts.get`)).set(credentials).query({ contactId: room.v.contactId });

			expect(res.status).to.be.equal(200);
			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.nested.property('contact').and.to.be.an('object');
			expect(res.body.contact.channels).to.be.an('array').with.lengthOf(1);
			expect(res.body.contact.channels[0].name).to.be.equal('api');
			expect(res.body.contact.channels[0].visitorId).to.be.equal(visitor._id);

			expect(res.body.contact).to.have.nested.property('activity').and.to.be.an('array').with.lengthOf(1);
			expect(res.body.contact.activity[0]).to.equal(moment.utc().format('YYYY-MM'));
		});
	});
});
