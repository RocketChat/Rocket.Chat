import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { createVisitor, createLivechatRoom, createAgent } from '../../../data/livechat/rooms.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - rooms', function () {
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

	describe('livechat/rooms', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/rooms'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should return an error when the "agents" query parameter is not valid', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/rooms?agents=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an error when the "roomName" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?roomName[]=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "departmentId" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?departmentId[]=marcos'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "open" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?open[]=true'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "tags" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?tags=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "createdAt" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?createdAt=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "closedAt" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?closedAt=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an error when the "customFields" query parameter is not valid', (done) => {
			request
				.get(api('livechat/rooms?customFields=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should return an array of rooms when has no parameters', (done) => {
			request
				.get(api('livechat/rooms'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return an array of rooms when the query params is all valid', (done) => {
			request
				.get(
					api(`livechat/rooms?agents[]=teste&departamentId=123&open=true&createdAt={"start": "2018-01-26T00:11:22.345Z", "end": "2018-01-26T00:11:22.345Z"}
			&closedAt={"start": "2018-01-26T00:11:22.345Z", "end": "2018-01-26T00:11:22.345Z"}&tags[]=rocket
			&customFields={"docId": "031041"}&count=3&offset=1&sort={"_updatedAt": 1}&fields={"msgs": 0}&roomName=test`),
				)
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
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
