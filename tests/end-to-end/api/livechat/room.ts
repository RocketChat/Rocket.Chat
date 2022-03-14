import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { createVisitor, createLivechatRoom, createAgent } from '../../../data/livechat/rooms.js';
import { updateSetting } from '../../../data/permissions.helper';

describe('livechat/room.close', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() => {
			createAgent()
				.then(() => createVisitor())
				.then((visitor) => createLivechatRoom(visitor.token))
				.then(() => done());
		});
	});

	describe('livechat/room.close', () => {
		it('should return an "invalid-token" error when the visitor is not found due to an invalid token', (done) => {
			request
				.get(api('livechat/room.close'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-token');
				})
				.end(done);
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', (done) => {
			request
				.get(api('livechat/room.close'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-room');
				})
				.end(done);
		});

		it('should return an "room-closed" error when the room is already closed', (done) => {
			request
				.get(api('livechat/room.close'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('room-closed');
				})
				.end(done);
		});

		it('should return an error when the "rid" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?rid=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?token=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return both the rid and the comment of the room when the query params is all valid', (done) => {
			request
				.get(api(`livechat/room.close?rid=123&token=321`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rid');
					expect(res.body).to.have.property('comment');
				})
				.end(done);
		});
	});
});
