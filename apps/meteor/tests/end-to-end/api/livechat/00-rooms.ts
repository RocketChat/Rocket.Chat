/* eslint-env mocha */

import fs from 'fs';
import path from 'path';

import { expect } from 'chai';
import type { IOmnichannelRoom, ILivechatVisitor } from '@rocket.chat/core-typings';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createVisitor, createLivechatRoom, createAgent, makeAgentAvailable } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - rooms', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;
	let room: IOmnichannelRoom;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() => {
			createAgent()
				.then(() => makeAgentAvailable())
				.then(() => createVisitor())
				.then((createdVisitor) => {
					visitor = createdVisitor;
					return createLivechatRoom(createdVisitor.token);
				})
				.then((createdRoom) => {
					room = createdRoom;
					done();
				});
		});
	});

	describe('livechat/rooms', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-rooms', []).then(() => {
				request
					.get(api('livechat/rooms'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should return an error when the "agents" query parameter is not valid', (done) => {
			updatePermission('view-livechat-rooms', ['admin']).then(() => {
				request
					.get(api('livechat/rooms?agents=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.expect((res: Response) => {
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
				.post(api('livechat/room.close'))
				.set(credentials)
				.send({
					token: 'invalid-token',
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-token');
				})
				.end(done);
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', (done) => {
			request
				.post(api('livechat/room.close'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: 'invalid-rid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-room');
				})
				.end(done);
		});

		it('should return both the rid and the comment of the room when the query params is all valid', (done) => {
			request
				.post(api(`livechat/room.close`))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rid');
					expect(res.body).to.have.property('comment');
				})
				.end(done);
		});

		it('should return an "room-closed" error when the room is already closed', (done) => {
			request
				.post(api('livechat/room.close'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('room-closed');
				})
				.end(done);
		});
	});

	describe('livechat/room.survey', () => {
		it('should return an "invalid-token" error when the visitor is not found due to an invalid token', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: 'invalid-token',
					rid: room._id,
					data: [{ name: 'question', value: 'answer' }],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				})
				.end(done);
		});

		it('should return an "invalid-room" error when the room is not found due to invalid token and/or rid', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: 'invalid-rid',
					data: [{ name: 'question', value: 'answer' }],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-room]');
				})
				.end(done);
		});

		it('should return "invalid-data" when the items answered are not part of config.survey.items', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
					data: [{ name: 'question', value: 'answer' }],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-data]');
				})
				.end(done);
		});

		it('should return the room id and the answers when the query params is all valid', (done) => {
			request
				.post(api('livechat/room.survey'))
				.set(credentials)
				.send({
					token: visitor.token,
					rid: room._id,
					data: [
						{ name: 'satisfaction', value: '5' },
						{ name: 'agentKnowledge', value: '3' },
					],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rid');
					expect(res.body).to.have.property('data');
					expect(res.body.data.satisfaction).to.be.equal('5');
					expect(res.body.data.agentKnowledge).to.be.equal('3');
				})
				.end(done);
		});
	});

	describe('livechat/upload/:rid', () => {
		it('should throw an error if x-visitor-token header is not present', (done) => {
			request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403)
				.end(done);
		});

		it('should throw an error if x-visitor-token is present but with an invalid value', (done) => {
			request
				.post(api('livechat/upload/test'))
				.set(credentials)
				.set('x-visitor-token', 'invalid-token')
				.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
				.expect('Content-Type', 'application/json')
				.expect(403)
				.end(done);
		});

		it('should throw unauthorized if visitor with token exists but room is invalid', (done) => {
			createVisitor()
				.then((visitor) => {
					request
						.post(api('livechat/upload/test'))
						.set(credentials)
						.set('x-visitor-token', visitor.token)
						.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		});

		it('should throw an error if the file is not attached', (done) => {
			createVisitor()
				.then((visitor) => {
					request
						.post(api('livechat/upload/test'))
						.set(credentials)
						.set('x-visitor-token', visitor.token)
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		});

		it('should upload an image on the room if all params are valid', (done) => {
			createVisitor()
				.then((visitor) => Promise.all([visitor, createLivechatRoom(visitor.token)]))
				.then(([visitor, room]) => {
					request
						.post(api(`livechat/upload/${room._id}`))
						.set(credentials)
						.set('x-visitor-token', visitor.token)
						.attach('file', fs.createReadStream(path.join(__dirname, '../../../data/livechat/sample.png')))
						.expect('Content-Type', 'application/json')
						.expect(200);
				})
				.then(() => done());
		});
	});
});
