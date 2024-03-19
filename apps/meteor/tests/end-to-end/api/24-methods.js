import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';

import { api, credentials, getCredentials, methodCall, request } from '../../data/api-data.js';
import { sendSimpleMessage } from '../../data/chat.helper.js';
import { CI_MAX_ROOMS_PER_GUEST as maxRoomsPerGuest } from '../../data/constants';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper.js';
import { IS_EE } from '../../e2e/config/constants';

describe('Meteor.methods', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[@getThreadMessages]', () => {
		let rid = false;
		let firstMessage = false;

		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('send sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					firstMessage = res.body.message;
				})
				.end(done);
		});

		before('send sample message into thread', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Second Sample message',
						rid,
						tmid: firstMessage._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('getThreadMessages'))
				.send({
					message: JSON.stringify({
						method: 'getThreadMessages',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return message thread', (done) => {
			request
				.post(methodCall('getThreadMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getThreadMessages',
						params: [{ tmid: firstMessage._id }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
					expect(data.result.length).to.equal(2);
				})
				.end(done);
		});
	});

	describe('[@getReadReceipts]', () => {
		it('should fail if not logged in', async () => {
			await request
				.post(methodCall('getReadReceipts'))
				.send({
					message: JSON.stringify({
						method: 'getReadReceipts',
						params: [{ messageId: 'test' }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message', 'You must be logged in to do this.');
				});
		});

		(!IS_EE ? describe : describe.skip)('[@getReadReceipts] CE', () => {
			it('should fail if there is no enterprise license', async () => {
				await request
					.post(methodCall('getReadReceipts'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'getReadReceipts',
							params: [{ messageId: 'test' }],
							id: 'id',
							msg: 'method',
						}),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						const data = JSON.parse(res.body.message);
						expect(data).to.have.property('error').that.is.an('object');
						expect(data.error).to.have.property('error', 'error-action-not-allowed');
						expect(data.error).to.have.property('message', 'This is an enterprise feature [error-action-not-allowed]');
					});
			});
		});

		(IS_EE ? describe : describe.skip)('[@getReadReceipts] EE', () => {
			let user = null;
			let userCredentials = null;
			let room = null;
			let firstMessage = null;
			let firstThreadMessage = null;

			const roomName = `methods-test-channel-${Date.now()}`;
			before(async () => {
				await Promise.all([updateSetting('Message_Read_Receipt_Enabled', true), updateSetting('Message_Read_Receipt_Store_Users', true)]);

				user = await createUser();
				userCredentials = await login(user.username, password);
				room = (await createRoom({ type: 'p', name: roomName, members: [user.username] })).body.group;
				firstMessage = (await sendSimpleMessage({ roomId: room._id })).body.message;
				firstThreadMessage = (await sendSimpleMessage({ roomId: room._id, tmid: firstMessage._id })).body.message;
			});

			after(() =>
				Promise.all([
					deleteRoom({ type: 'p', roomId: room._id }),
					deleteUser(user),
					updateSetting('Message_Read_Receipt_Enabled', false),
					updateSetting('Message_Read_Receipt_Store_Users', false),
				]),
			);

			describe('simple message and thread that nobody has read yet', () => {
				it("should return only the sender's read receipt for a message sent in the main room", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: firstMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(1);
							expect(data.result[0]).to.have.property('userId', credentials['X-User-Id']);
						});
				});

				it("should return only the sender's read receipt for a message sent in a thread", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: firstThreadMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(1);
							expect(data.result[0]).to.have.property('userId', credentials['X-User-Id']);
						});
				});
			});

			describe('simple message and thread where the room message was read by the invited user but the thread message was not', () => {
				before("should read all main room's messages with the invited user", async () => {
					await request
						.post(methodCall('readMessages'))
						.set(userCredentials)
						.send({
							message: JSON.stringify({
								id: 'id',
								msg: 'method',
								method: 'readMessages',
								params: [room._id, true],
							}),
						});
				});

				it("should return both the sender's and the invited user's read receipt for a message sent in the main room", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: firstMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(2);

							const receiptsUserIds = [data.result[0].userId, data.result[1].userId];
							expect(receiptsUserIds).to.have.members([credentials['X-User-Id'], user._id]);
						});
				});

				it("should return only the sender's read receipt for a message sent in a thread", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: firstThreadMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(1);
							expect(data.result[0]).to.have.property('userId', credentials['X-User-Id']);
						});
				});
			});

			describe('simple message and thread where both was read by the invited user', () => {
				before('should read thread messages with the invited user', async () => {
					await request
						.post(methodCall('getThreadMessages'))
						.set(userCredentials)
						.send({
							message: JSON.stringify({
								id: 'id',
								msg: 'method',
								method: 'getThreadMessages',
								params: [
									{
										tmid: firstMessage._id,
									},
								],
							}),
						});
				});

				it("should return both the sender's and invited user's read receipt for a message sent in a thread", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: firstThreadMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(2);

							const receiptsUserIds = [data.result[0].userId, data.result[1].userId];
							expect(receiptsUserIds).to.have.members([credentials['X-User-Id'], user._id]);
						});
				});
			});

			describe('simple message and thread marked as read by the invited user', () => {
				let otherMessage = null;
				let otherThreadMessage = null;

				before('should send another message and create a thread', async () => {
					otherMessage = (await sendSimpleMessage({ roomId: room._id })).body.message;
					otherThreadMessage = (await sendSimpleMessage({ roomId: room._id, tmid: otherMessage._id })).body.message;
				});

				before('should mark the thread as read by the invited user', async () => {
					await request
						.post(methodCall('readThreads'))
						.set(userCredentials)
						.send({
							message: JSON.stringify({
								method: 'readThreads',
								params: [otherMessage._id],
								id: 'id',
								msg: 'method',
							}),
						});
				});

				it("should return both the sender's and invited user's read receipt for a message sent in the main room", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: otherThreadMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(2);

							const receiptsUserIds = [data.result[0].userId, data.result[1].userId];
							expect(receiptsUserIds).to.have.members([credentials['X-User-Id'], user._id]);
						});
				});

				it("should return both the sender's and invited user's read receipt for a message sent in a thread", async () => {
					await request
						.post(methodCall('getReadReceipts'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'getReadReceipts',
								params: [{ messageId: otherThreadMessage._id }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.equal(2);

							const receiptsUserIds = [data.result[0].userId, data.result[1].userId];
							expect(receiptsUserIds).to.have.members([credentials['X-User-Id'], user._id]);
						});
				});
			});
		});
	});

	describe('[@getMessages]', () => {
		let rid = false;
		let firstMessage = false;
		let lastMessage = false;

		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('send sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					firstMessage = res.body.message;
				})
				.end(done);
		});

		before('send another sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Second Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					lastMessage = res.body.message;
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('getMessages'))
				.send({
					message: JSON.stringify({
						method: 'getMessages',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if msgIds not specified', (done) => {
			request
				.post(methodCall('getMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getMessages',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('error').that.is.an('object');
					expect(data.error).to.have.a.property('sanitizedError');
					expect(data.error.sanitizedError).to.have.property('error', 400);
				})
				.end(done);
		});

		it('should return the first message', (done) => {
			request
				.post(methodCall('getMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getMessages',
						params: [[firstMessage._id]],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
					expect(data.result.length).to.equal(1);
				})
				.end(done);
		});

		it('should return both messages', (done) => {
			request
				.post(methodCall('getMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getMessages',
						params: [[firstMessage._id, lastMessage._id]],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
					expect(data.result.length).to.equal(2);
				})
				.end(done);
		});
	});

	describe('[@cleanRoomHistory]', () => {
		let rid = false;

		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('send sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		before('send another sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Second Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should not change the _updatedAt value when nothing is changed on the room', async () => {
			const roomBefore = await request.get(api('groups.info')).set(credentials).query({
				roomId: rid,
			});

			await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: rid,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
					excludePinned: false,
					filesOnly: false,
					ignoreThreads: false,
					ignoreDiscussion: false,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('count', 0);
				});

			const roomAfter = await request.get(api('groups.info')).set(credentials).query({
				roomId: rid,
			});
			expect(roomBefore.body.group._updatedAt).to.be.equal(roomAfter.body.group._updatedAt);
		});

		it('should change the _updatedAt value when room is cleaned', async () => {
			const roomBefore = await request.get(api('groups.info')).set(credentials).query({
				roomId: rid,
			});

			await request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: rid,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
					excludePinned: false,
					filesOnly: false,
					ignoreThreads: false,
					ignoreDiscussion: false,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('count', 2);
				});

			const roomAfter = await request.get(api('groups.info')).set(credentials).query({
				roomId: rid,
			});
			expect(roomBefore.body.group._updatedAt).to.not.be.equal(roomAfter.body.group._updatedAt);
		});
	});

	describe('[@loadHistory]', () => {
		let rid = false;
		let postMessageDate = false;
		let lastMessage = false;

		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('send sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					postMessageDate = { $date: new Date().getTime() };
				})
				.end(done);
		});

		before('send another sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Second Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					lastMessage = res.body.message;
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('loadHistory'))
				.send({
					message: JSON.stringify({
						method: 'loadHistory',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if roomId not specified', (done) => {
			request
				.post(methodCall('loadHistory'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadHistory',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('error').that.is.an('object');
					expect(data.error).to.have.a.property('sanitizedError');
					expect(data.error.sanitizedError).to.have.property('error', 400);
				})
				.end(done);
		});

		it('should return all messages for the specified room', (done) => {
			request
				.post(methodCall('loadHistory'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						id: 'id',
						msg: 'method',
						method: 'loadHistory',
						params: [rid],
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(2);
				})
				.end(done);
		});

		it('should return only the first message', (done) => {
			request
				.post(methodCall('loadHistory'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadHistory',
						params: [rid, postMessageDate],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(1);
				})
				.end(done);
		});

		it('should return only one message when limit = 1', (done) => {
			request
				.post(methodCall('loadHistory'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadHistory',
						params: [rid, { $date: new Date().getTime() }, 1],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(1);
				})
				.end(done);
		});

		it('should return the messages since the last one', (done) => {
			request
				.post(methodCall('loadHistory'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadHistory',
						params: [rid, null, 20, lastMessage],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(2);
				})
				.end(done);
		});
	});

	describe('[@loadNextMessages]', () => {
		let rid = false;
		let postMessageDate = false;
		const startDate = { $date: new Date().getTime() };

		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('send sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					postMessageDate = { $date: new Date().getTime() };
				})
				.end(done);
		});

		before('send another sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Second Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('loadNextMessages'))
				.send({
					message: JSON.stringify({
						method: 'loadNextMessages',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if roomId not specified', (done) => {
			request
				.post(methodCall('loadNextMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadNextMessages',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('error').that.is.an('object');
					expect(data.error).to.have.a.property('sanitizedError');
					expect(data.error.sanitizedError).to.have.property('error', 400);
				})
				.end(done);
		});

		it('should return all messages for the specified room', (done) => {
			request
				.post(methodCall('loadNextMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadNextMessages',
						params: [rid],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(2);
				})
				.end(done);
		});

		it('should return only the latest message', (done) => {
			request
				.post(methodCall('loadNextMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadNextMessages',
						params: [rid, postMessageDate],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(1);
				})
				.end(done);
		});

		it('should return only one message when limit = 1', (done) => {
			request
				.post(methodCall('loadNextMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadNextMessages',
						params: [rid, startDate, 1],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('messages').that.is.an('array');
					expect(data.result.messages.length).to.equal(1);
				})
				.end(done);
		});
	});

	describe('[@getUsersOfRoom]', () => {
		let testUser;
		let rid = false;

		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('create test user', (done) => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;
			request
				.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password: username })
				.end((err, res) => {
					testUser = res.body.user;
					done();
				});
		});

		before('add user to room', (done) => {
			request
				.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: rid,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end(done);
		});

		after(() => Promise.all([deleteRoom({ type: 'p', roomId: rid }), deleteUser(testUser)]));

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('getUsersOfRoom'))
				.send({
					message: JSON.stringify({
						method: 'getUsersOfRoom',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if roomId not specified', (done) => {
			request
				.post(methodCall('getUsersOfRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getUsersOfRoom',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('error').that.is.an('object');
					expect(data.error).to.have.a.property('error', 'error-invalid-room');
				})
				.end(done);
		});

		it('should return the users for the specified room', (done) => {
			request
				.post(methodCall('getUsersOfRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getUsersOfRoom',
						params: [rid],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('total', 2);
				})
				.end(done);
		});
	});

	describe('[@getUserRoles]', () => {
		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('getUserRoles'))
				.send({
					message: JSON.stringify({
						method: 'getUserRoles',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return the roles for the current user', (done) => {
			request
				.post(methodCall('getUserRoles'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getUserRoles',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
				})
				.end(done);
		});
	});

	describe('[@listCustomUserStatus]', () => {
		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('listCustomUserStatus'))
				.send({
					message: JSON.stringify({
						method: 'listCustomUserStatus',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return custom status for the current user', (done) => {
			request
				.post(methodCall('listCustomUserStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'listCustomUserStatus',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
				})
				.end(done);
		});
	});

	describe('[@permissions:get]', () => {
		const date = {
			$date: new Date().getTime(),
		};

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('permissions:get'))
				.send({
					message: JSON.stringify({
						method: 'permissions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return all permissions', (done) => {
			request
				.post(methodCall('permissions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'permissions/get',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
					expect(data.result.length).to.be.above(1);
				})
				.end(done);
		});

		it('should return all permissions after the given date', (done) => {
			request
				.post(methodCall('permissions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'permissions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('update').that.is.an('array');
				})
				.end(done);
		});
	});

	describe('[@loadMissedMessages]', () => {
		let rid = false;
		const date = {
			$date: new Date().getTime(),
		};
		let postMessageDate = false;

		const channelName = `methods-test-channel-${Date.now()}`;

		before('create test group', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		before('send sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					postMessageDate = { $date: new Date().getTime() };
				})
				.end(done);
		});

		before('send another sample message', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Second Sample message',
						rid,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('loadMissedMessages'))
				.send({
					message: JSON.stringify({
						method: 'loadMissedMessages',
						params: [rid, date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return an error if the rid param is empty', (done) => {
			request
				.post(methodCall('loadMissedMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadMissedMessages',
						params: ['', date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.include('error-invalid-room');
				})
				.end(done);
		});

		it('should return an error if the start param is missing', (done) => {
			request
				.post(methodCall('loadMissedMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadMissedMessages',
						params: [rid],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.include('Match error');
				})
				.end(done);
		});

		it('should return and empty list if using current time', (done) => {
			request
				.post(methodCall('loadMissedMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadMissedMessages',
						params: [rid, { $date: new Date().getTime() }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.a('array');
					expect(data.result.length).to.be.equal(0);
				})
				.end(done);
		});

		it('should return two messages if using a time from before the first msg was sent', (done) => {
			request
				.post(methodCall('loadMissedMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadMissedMessages',
						params: [rid, date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.a('array');
					expect(data.result.length).to.be.equal(2);
				})
				.end(done);
		});

		it('should return a single message if using a time from in between the messages', (done) => {
			request
				.post(methodCall('loadMissedMessages'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'loadMissedMessages',
						params: [rid, postMessageDate],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.a('array');
					expect(data.result.length).to.be.equal(1);
				})
				.end(done);
		});
	});

	describe('[@public-settings:get]', () => {
		const date = {
			$date: new Date().getTime(),
		};

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('public-settings:get'))
				.send({
					message: JSON.stringify({
						method: 'public-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return the list of public settings', (done) => {
			request
				.post(methodCall('public-settings:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'public-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
				})
				.end(done);
		});
	});

	describe('[@private-settings:get]', () => {
		const date = {
			$date: 0,
		};

		after(() =>
			Promise.all([
				updatePermission('view-privileged-setting', ['admin']),
				updatePermission('edit-privileged-setting', ['admin']),
				updatePermission('manage-selected-settings', ['admin']),
			]),
		);

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('private-settings:get'))
				.send({
					message: JSON.stringify({
						method: 'private-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return nothing when user doesnt have any permission', (done) => {
			updatePermission('view-privileged-setting', [])
				.then(updatePermission('edit-privileged-setting', []))
				.then(updatePermission('manage-selected-settings', []))
				.then(() => {
					request
						.post(methodCall('private-settings:get'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'private-settings/get',
								params: [date],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.be.equal(0);
						})
						.end(done);
				});
		});

		it('should return properties when user has any related permissions', (done) => {
			updatePermission('view-privileged-setting', ['admin']).then(() => {
				request
					.post(methodCall('private-settings:get'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'private-settings/get',
							params: [date],
							id: 'id',
							msg: 'method',
						}),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('message').that.is.a('string');

						const data = JSON.parse(res.body.message);
						expect(data).to.have.a.property('result').that.is.an('object');
						expect(data.result).to.have.a.property('update').that.is.an('array');
						expect(data.result.update.length).to.not.equal(0);
					})
					.end(done);
			});
		});

		it('should return properties when user has all related permissions', (done) => {
			updatePermission('view-privileged-setting', ['admin'])
				.then(updatePermission('edit-privileged-setting', ['admin']))
				.then(updatePermission('manage-selected-settings', ['admin']))
				.then(() => {
					request
						.post(methodCall('private-settings:get'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'private-settings/get',
								params: [date],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('object');
							expect(data.result).to.have.a.property('update').that.is.an('array');
							expect(data.result.update.length).to.not.equal(0);
						})
						.end(done);
				});
		});
	});

	describe('[@subscriptions:get]', () => {
		const date = {
			$date: new Date().getTime(),
		};

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('subscriptions:get'))
				.send({
					message: JSON.stringify({
						method: 'subscriptions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return all subscriptions', (done) => {
			request
				.post(methodCall('subscriptions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'subscriptions/get',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('array');
					expect(data.result.length).to.be.above(1);
				})
				.end(done);
		});

		it('should return all subscriptions after the given date', (done) => {
			request
				.post(methodCall('subscriptions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'subscriptions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('update').that.is.an('array');
				})
				.end(done);
		});
	});

	describe('[@sendMessage]', () => {
		let rid = false;
		let channelName = false;

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		after(() => deleteRoom({ type: 'p', roomId: rid }));

		it('should send a message', (done) => {
			request
				.post(methodCall('sendMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'sendMessage',
						params: [{ _id: `${Date.now() + Math.random()}`, rid, msg: 'test message' }],
						id: 1000,
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result.msg).to.equal('test message');
				})
				.end(done);
		});

		it('should parse correctly urls sent in message', (done) => {
			request
				.post(methodCall('sendMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'sendMessage',
						params: [
							{
								_id: `${Date.now() + Math.random()}`,
								rid,
								msg: 'test message with https://github.com',
							},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('urls').that.is.an('array');
					expect(data.result.urls[0].url).to.equal('https://github.com');
				})
				.end(done);
		});
	});

	describe('[@updateMessage]', () => {
		let rid = false;
		let roomName = false;
		let messageId;
		let simpleMessageId;
		let messageWithMarkdownId;
		let channelName = false;
		const siteUrl = process.env.SITE_URL || process.env.TEST_API_URL || 'http://localhost:3000';

		before('create room', (done) => {
			channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
					roomName = res.body.group.name;
				})
				.end(done);
		});

		before('send simple message', async () => {
			const res = await sendSimpleMessage({ roomId: rid });
			simpleMessageId = res.body.message._id;
		});

		before('send message with URL', (done) => {
			request
				.post(methodCall('sendMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'sendMessage',
						params: [
							{
								_id: `${Date.now() + Math.random()}`,
								rid,
								msg: 'test message with https://github.com',
							},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('urls').that.is.an('array');
					expect(data.result.urls[0].url).to.equal('https://github.com');
					messageId = data.result._id;
				})
				.end(done);
		});

		before('send message with URL inside markdown', (done) => {
			request
				.post(methodCall('sendMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'sendMessage',
						params: [
							{
								_id: `${Date.now() + Math.random()}`,
								rid,
								msg: 'test message with ```https://github.com```',
							},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					messageWithMarkdownId = data.result._id;
				})
				.end(done);
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'p', roomId: rid }),
				updatePermission('bypass-time-limit-edit-and-delete', ['bot', 'app']),
				updateSetting('Message_AllowEditing_BlockEditInMinutes', 0),
			]),
		);

		it('should update a message with a URL', (done) => {
			request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [{ _id: messageId, rid, msg: 'https://github.com updated' }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('msg').that.is.an('string');
				})
				.end(done);
		});

		it('should add a quote attachment to a message', async () => {
			const quotedMsgLink = `${siteUrl}/group/${roomName}?msg=${messageWithMarkdownId}`;
			await request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [{ _id: messageId, rid, msg: `${quotedMsgLink} updated` }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
				});

			await request
				.get(api(`chat.getMessage?msgId=${messageId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('message').that.is.an('object');
					expect(res.body.message).to.have.property('msg', `${quotedMsgLink} updated`);
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(1);
					expect(res.body.message.attachments[0]).to.have.property('message_link', quotedMsgLink);
				});
		});

		it('should replace a quote attachment in a message', async () => {
			const quotedMsgLink = `${siteUrl}/group/${roomName}?msg=${simpleMessageId}`;
			await request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [{ _id: messageId, rid, msg: `${quotedMsgLink} updated` }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
				});

			await request
				.get(api(`chat.getMessage?msgId=${messageId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('message').that.is.an('object');
					expect(res.body.message).to.have.property('msg', `${quotedMsgLink} updated`);
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(1);
					expect(res.body.message.attachments[0]).to.have.property('message_link', quotedMsgLink);
				});
		});

		it('should add multiple quote attachments in a single message', async () => {
			const quotedMsgLink = `${siteUrl}/group/${roomName}?msg=${simpleMessageId}`;
			const newQuotedMsgLink = `${siteUrl}/group/${roomName}?msg=${messageWithMarkdownId}`;
			await request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [{ _id: messageId, rid, msg: `${newQuotedMsgLink} ${quotedMsgLink} updated` }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
				});

			await request
				.get(api(`chat.getMessage?msgId=${messageId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('message').that.is.an('object');
					expect(res.body.message).to.have.property('msg', `${newQuotedMsgLink} ${quotedMsgLink} updated`);
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(2);
					expect(res.body.message.attachments[0]).to.have.property('message_link', newQuotedMsgLink);
					expect(res.body.message.attachments[1]).to.have.property('message_link', quotedMsgLink);
				});
		});

		it('should remove a quote attachment from a message', async () => {
			await request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [{ _id: messageId, rid, msg: 'updated' }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
				});

			await request
				.get(api(`chat.getMessage?msgId=${messageId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('message').that.is.an('object');
					expect(res.body.message).to.have.property('msg', 'updated');
					expect(res.body.message).to.have.property('attachments').that.is.an('array').that.has.lengthOf(0);
				});
		});

		it('should update a message when bypass time limits permission is enabled', async () => {
			await Promise.all([
				updatePermission('bypass-time-limit-edit-and-delete', ['admin']),
				updateSetting('Message_AllowEditing_BlockEditInMinutes', 0.01),
			]);

			await request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [{ _id: messageId, rid, msg: 'https://github.com updated with bypass' }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
				});

			await request
				.get(api(`chat.getMessage?msgId=${messageId}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('message').that.is.an('object');
					expect(res.body.message.msg).to.equal('https://github.com updated with bypass');
				});

			await Promise.all([
				updatePermission('bypass-time-limit-edit-and-delete', ['bot', 'app']),
				updateSetting('Message_AllowEditing_BlockEditInMinutes', 0),
			]);
		});

		it('should not parse URLs inside markdown on update', (done) => {
			request
				.post(methodCall('updateMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'updateMessage',
						params: [
							{
								_id: messageWithMarkdownId,
								rid,
								msg: 'test message with ```https://github.com``` updated',
							},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('msg').that.is.an('string');
				})
				.then(() => {
					request
						.get(api(`chat.getMessage?msgId=${messageWithMarkdownId}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('message').that.is.an('object');
							expect(res.body.message.msg).to.equal('test message with ```https://github.com``` updated');
							expect(res.body.message).to.have.property('urls');
							expect(res.body.message.urls.length).to.be.equal(0);
						})
						.end(done);
				});
		});

		['tshow', 'alias', 'attachments', 'avatar', 'emoji', 'msg'].forEach((prop) => {
			it(`should allow to update a message changing property '${prop}'`, (done) => {
				request
					.post(methodCall('updateMessage'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'updateMessage',
							params: [{ _id: messageId, rid, msg: 'Message updated', [prop]: 'valid' }],
							id: 'id',
							msg: 'method',
						}),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('message').that.is.a('string');
						const data = JSON.parse(res.body.message);
						expect(data).to.have.a.property('msg').that.is.a('string');
					})
					.end(done);
			});
		});

		['tmid', '_hidden', 'rid'].forEach((prop) => {
			it(`should fail to update a message changing invalid property '${prop}'`, (done) => {
				request
					.post(methodCall('updateMessage'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'updateMessage',
							params: [{ _id: messageId, rid, msg: 'Message updated invalid', [prop]: 'invalid' }],
							id: 'id',
							msg: 'method',
						}),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('message').that.is.a('string');

						const data = JSON.parse(res.body.message);
						expect(data).to.have.a.property('error').that.is.an('object');
						expect(data.error).to.have.a.property('error', 'error-invalid-update-key');
					})
					.end(done);
			});
		});
	});

	describe('[@deleteMessage]', () => {
		let rid = false;
		let messageId;

		before('create room', (done) => {
			const channelName = `methods-test-channel-${Date.now()}`;
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: channelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', channelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					rid = res.body.group._id;
				})
				.end(done);
		});

		beforeEach('send message with URL', (done) => {
			request
				.post(methodCall('sendMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'sendMessage',
						params: [
							{
								_id: `${Date.now() + Math.random()}`,
								rid,
								msg: 'test message with https://github.com',
							},
						],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');

					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('result').that.is.an('object');
					expect(data.result).to.have.a.property('urls').that.is.an('array');
					expect(data.result.urls[0].url).to.equal('https://github.com');
					messageId = data.result._id;
				})
				.end(done);
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'p', roomId: rid }),
				updatePermission('bypass-time-limit-edit-and-delete', ['bot', 'app']),
				updateSetting('Message_AllowEditing_BlockEditInMinutes', 0),
			]),
		);

		it('should delete a message', (done) => {
			request
				.post(methodCall('deleteMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'deleteMessage',
						params: [{ _id: messageId, rid }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('msg', 'result');
					expect(data).to.have.a.property('id', 'id');
				})
				.end(done);
		});

		it('should delete a message when bypass time limits permission is enabled', async () => {
			await Promise.all([
				updatePermission('bypass-time-limit-edit-and-delete', ['admin']),
				updateSetting('Message_AllowEditing_BlockEditInMinutes', 0.01),
			]);

			await request
				.post(methodCall('deleteMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'deleteMessage',
						params: [{ _id: messageId, rid }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('message').that.is.a('string');
					const data = JSON.parse(res.body.message);
					expect(data).to.have.a.property('msg', 'result');
					expect(data).to.have.a.property('id', 'id');
				});

			await Promise.all([
				updatePermission('bypass-time-limit-edit-and-delete', ['bot', 'app']),
				updateSetting('Message_AllowEditing_BlockEditInMinutes', 0),
			]);
		});
	});

	describe('[@setUserActiveStatus]', () => {
		let testUser;
		let testUser2;
		let testUserCredentials;
		let dmId;
		let dmTestId;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
			testUserCredentials = await login(testUser.username, password);
		});

		before('create direct conversation with user', (done) => {
			request
				.post(methodCall('createDirectMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'createDirectMessage',
						params: [testUser.username],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.an('object');
					expect(result.result).to.have.property('rid').that.is.an('string');

					dmId = result.result.rid;
					done();
				});
		});

		before('create direct conversation between both users', (done) => {
			request
				.post(methodCall('createDirectMessage'))
				.set(testUserCredentials)
				.send({
					message: JSON.stringify({
						method: 'createDirectMessage',
						params: [testUser2.username],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.an('object');
					expect(result.result).to.have.property('rid').that.is.an('string');

					dmTestId = result.result.rid;
					done();
				});
		});

		after(() =>
			Promise.all([
				deleteRoom({ type: 'd', roomId: dmId }),
				deleteRoom({ type: 'd', roomId: dmTestId }),
				deleteUser(testUser),
				deleteUser(testUser2),
			]),
		);

		it('should deactivate a user', (done) => {
			request
				.post(methodCall('setUserActiveStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'setUserActiveStatus',
						params: [testUser._id, false, false],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body).to.have.property('success').that.is.an('boolean');
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.equal(true);
					done();
				});
		});

		it('should deactivate another user', (done) => {
			request
				.post(methodCall('setUserActiveStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'setUserActiveStatus',
						params: [testUser2._id, false, false],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body).to.have.property('success').that.is.an('boolean');
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.equal(true);
					done();
				});
		});

		it('should mark the direct conversation between admin=>testUser as readonly when user is deactivated', (done) => {
			request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body.success).to.equal(true);
					const result = JSON.parse(res.body.message);
					expect(result.result.ro).to.equal(true);
					done();
				});
		});

		it('should activate a user', (done) => {
			request
				.post(methodCall('setUserActiveStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'setUserActiveStatus',
						params: [testUser._id, true, false],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body).to.have.property('success').that.is.an('boolean');
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.equal(true);
					done();
				});
		});

		it('should set readonly=false when user is activated (and the other side is also active)', (done) => {
			request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body.success).to.equal(true);
					const result = JSON.parse(res.body.message);
					expect(result.result.ro).to.equal(false);
					done();
				});
		});

		it('should keep the direct conversation between testUser=>testUser2 as readonly when one of them is deactivated', (done) => {
			request
				.post(api('login'))
				.send({
					user: testUser.username,
					password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testUserCredentials['X-Auth-Token'] = res.body.data.authToken;
					testUserCredentials['X-User-Id'] = res.body.data.userId;
				})
				.then(() => {
					request
						.post(methodCall('getRoomByTypeAndName'))
						.set(testUserCredentials)
						.send({
							message: JSON.stringify({
								method: 'getRoomByTypeAndName',
								params: ['d', dmTestId],
								id: 'id',
								msg: 'method',
							}),
						})
						.end((err, res) => {
							expect(res.body.success).to.equal(true);
							const result = JSON.parse(res.body.message);
							expect(result.result.ro).to.equal(true);
							done();
						});
				})
				.catch(done);
		});

		it('should activate another user', (done) => {
			request
				.post(methodCall('setUserActiveStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'setUserActiveStatus',
						params: [testUser2._id, true, false],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body).to.have.property('success').that.is.an('boolean');
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.equal(true);
					done();
				});
		});

		it('should set readonly=false when both users are activated', (done) => {
			request
				.post(methodCall('getRoomByTypeAndName'))
				.set(testUserCredentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmTestId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body.success).to.equal(true);
					const result = JSON.parse(res.body.message);
					expect(result.result.ro).to.equal(false);
					done();
				});
		});

		it('should keep readonly=true when user is activated (and the other side is deactivated)', (done) => {
			request
				.post(methodCall('getRoomByTypeAndName'))
				.set(testUserCredentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmTestId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((err, res) => {
					expect(res.body.success).to.equal(true);
					const result = JSON.parse(res.body.message);
					expect(result.result.ro).to.equal(false);
					done();
				});
		});
	});

	describe('[@addUsersToRoom]', () => {
		let guestUser;
		let user;
		let room;
		let createdRooms = [];

		before(async () => {
			guestUser = await createUser({ roles: ['guest'] });
			user = await createUser();
			room = (
				await createRoom({
					type: 'c',
					name: `channel.test.${Date.now()}-${Math.random()}`,
				})
			).body.channel;
			createdRooms.push(room);
		});
		after(() =>
			Promise.all([...createdRooms.map((r) => deleteRoom({ type: 'c', roomId: r._id })), deleteUser(user), deleteUser(guestUser)]),
		);

		it('should fail if not logged in', (done) => {
			request
				.post(methodCall('addUsersToRoom'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should add a single user to a room', (done) => {
			request
				.post(methodCall('addUsersToRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'addUsersToRoom',
						params: [{ rid: room._id, users: [user.username] }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.then(() => {
					request
						.get(api('channels.members'))
						.set(credentials)
						.query({
							roomId: room._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('members').and.to.be.an('array');
							expect(res.body.members).to.have.lengthOf(2);
						})
						.end(done);
				})
				.catch(done);
		});

		it('should not add guest users to more rooms than defined in the license', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!process.env.IS_EE) {
				this.skip();
			}
			const promises = [];
			for (let i = 0; i < maxRoomsPerGuest; i++) {
				promises.push(
					createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						members: [guestUser.username],
					}),
				);
			}
			createdRooms = [...createdRooms, ...(await Promise.all(promises)).map((res) => res.body.channel)];

			request
				.post(methodCall('addUsersToRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'addUsersToRoom',
						params: [{ rid: room._id, users: [guestUser.username] }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const parsedBody = JSON.parse(res.body.message);
					expect(parsedBody).to.have.property('error');
					expect(parsedBody.error).to.have.property('error', 'error-max-rooms-per-guest-reached');
				});
		});
	});

	describe('[@muteUserInRoom & @unmuteUserInRoom]', () => {
		let rid = null;
		let channelName = null;
		let testUser = null;
		let testUserCredentials = {};

		before('create test user', async () => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;

			testUser = await createUser({ email, name: username, username, password: username, roles: ['user'] });
		});

		before('create channel', async () => {
			channelName = `methods-test-channel-${Date.now()}`;
			rid = (await createRoom({ type: 'c', name: channelName, members: [testUser.username] })).body.channel._id;
		});

		before('login testUser', async () => {
			testUserCredentials = await login(testUser.username, testUser.username);
		});

		after(() => Promise.all([deleteRoom({ type: 'c', roomId: rid }), deleteUser(testUser)]));

		describe('-> standard room', () => {
			describe('- when muting a user in a standard room', () => {
				it('should mute an user in a standard room', async () => {
					await request
						.post(methodCall('muteUserInRoom'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'muteUserInRoom',
								params: [{ rid, username: testUser.username }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');
							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('msg', 'result');
							expect(data).to.have.a.property('id', 'id');
							expect(data).not.to.have.a.property('error');
						});
				});

				it('muted user should not be able to send message', async () => {
					await request
						.post(api('chat.sendMessage'))
						.set(testUserCredentials)
						.send({
							message: {
								msg: 'Sample message',
								rid,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error').that.is.a('string');
							expect(res.body.error).to.equal('You_have_been_muted');
						});
				});
			});

			describe('- when unmuting a user in a standard room', () => {
				it('should unmute an user in a standard room', async () => {
					await request
						.post(methodCall('unmuteUserInRoom'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'unmuteUserInRoom',
								params: [{ rid, username: testUser.username }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');
							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('msg', 'result');
							expect(data).to.have.a.property('id', 'id');
							expect(data).not.to.have.a.property('error');
						});
				});

				it('unmuted user should be able to send message', async () => {
					await request
						.post(api('chat.sendMessage'))
						.set(testUserCredentials)
						.send({
							message: {
								msg: 'Sample message',
								rid,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						});
				});
			});
		});

		describe('-> read-only room', () => {
			before('set room to read-only', async () => {
				await request
					.post(api('channels.setReadOnly'))
					.set(credentials)
					.send({
						roomId: rid,
						readOnly: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);
			});

			it('should not allow an user to send messages', async () => {
				await request
					.post(api('chat.sendMessage'))
					.set(testUserCredentials)
					.send({
						message: {
							msg: 'Sample message',
							rid,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error').that.is.a('string');
						expect(res.body.error).to.equal(`You can't send messages because the room is readonly.`);
					});
			});

			describe('- when unmuting a user in a read-only room', () => {
				it('should unmute an user in a read-only room', async () => {
					await request
						.post(methodCall('unmuteUserInRoom'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'unmuteUserInRoom',
								params: [{ rid, username: testUser.username }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');
							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('msg', 'result');
							expect(data).to.have.a.property('id', 'id');
							expect(data).not.to.have.a.property('error');
						});
				});

				it('unmuted user in read-only room should be able to send message', async () => {
					await request
						.post(api('chat.sendMessage'))
						.set(testUserCredentials)
						.send({
							message: {
								msg: 'Sample message',
								rid,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						});
				});
			});

			describe('- when muting a user in a read-only room', () => {
				it('should mute an user in a read-only room', async () => {
					await request
						.post(methodCall('muteUserInRoom'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'muteUserInRoom',
								params: [{ rid, username: testUser.username }],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');
							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('msg', 'result');
							expect(data).to.have.a.property('id', 'id');
							expect(data).not.to.have.a.property('error');
						});
				});

				it('muted user in read-only room should not be able to send message', async () => {
					await request
						.post(api('chat.sendMessage'))
						.set(testUserCredentials)
						.send({
							message: {
								msg: 'Sample message',
								rid,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error').that.is.a('string');
						});
				});
			});
		});
	});
});
