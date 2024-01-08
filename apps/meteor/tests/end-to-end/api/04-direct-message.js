import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, directMessage, apiUsername, apiEmail, methodCall } from '../../data/api-data.js';
import { updateSetting, updatePermission } from '../../data/permissions.helper';
import { deleteRoom } from '../../data/rooms.helper';
import { testFileUploads } from '../../data/uploads.helper';
import { password, adminUsername } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Direct Messages]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before('/chat.postMessage', (done) => {
		request
			.post(api('chat.postMessage'))
			.set(credentials)
			.send({
				channel: 'rocket.cat',
				text: 'This message was sent using the API',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
				expect(res.body).to.have.nested.property('message.rid');
				directMessage._id = res.body.message.rid;
			})
			.end(done);
	});

	describe('/im.setTopic', () => {
		it('should set the topic of the DM with a string', (done) => {
			request
				.post(api('im.setTopic'))
				.set(credentials)
				.send({
					roomId: directMessage._id,
					topic: 'a direct message with rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', 'a direct message with rocket.cat');
				})
				.end(done);
		});
		it('should set the topic of DM with an empty string(remove the topic)', (done) => {
			request
				.post(api('im.setTopic'))
				.set(credentials)
				.send({
					roomId: directMessage._id,
					topic: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', '');
				})
				.end(done);
		});
	});

	describe('Testing DM info', () => {
		let testDM = {};
		let dmMessage = {};
		it('creating new DM...', (done) => {
			request
				.post(api('im.create'))
				.set(credentials)
				.send({
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testDM = res.body.room;
				})
				.end(done);
		});
		it('sending a message...', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: testDM._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					dmMessage = res.body.message;
				})
				.end(done);
		});
		it('REACTing with last message', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: dmMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('STARring last message', (done) => {
			request
				.post(api('chat.starMessage'))
				.set(credentials)
				.send({
					messageId: dmMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('PINning last message', (done) => {
			request
				.post(api('chat.pinMessage'))
				.set(credentials)
				.send({
					messageId: dmMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return all DM messages where the last message of array should have the "star" array with USERS star ONLY', (done) => {
			request
				.get(api('im.messages'))
				.set(credentials)
				.query({
					roomId: testDM._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const { messages } = res.body;
					const lastMessage = messages.filter((message) => message._id === dmMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
	});

	it('/im.history', (done) => {
		request
			.get(api('im.history'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('messages');
			})
			.end(done);
	});

	it('/im.list', (done) => {
		request
			.get(api('im.list'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count', 1);
				expect(res.body).to.have.property('total', 1);
				expect(res.body).to.have.property('ims').and.to.be.an('array');
				const im = res.body.ims[0];
				expect(im).to.have.property('_id');
				expect(im).to.have.property('t').and.to.be.eq('d');
				expect(im).to.have.property('msgs').and.to.be.a('number');
				expect(im).to.have.property('usernames').and.to.be.an('array');
				expect(im).to.have.property('lm');
				expect(im).to.have.property('_updatedAt');
				expect(im).to.have.property('ts');
				expect(im).to.have.property('lastMessage');
			})
			.end(done);
	});

	it('/im.list.everyone', (done) => {
		request
			.get(api('im.list.everyone'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count', 1);
				expect(res.body).to.have.property('total', 1);
				expect(res.body).to.have.property('ims').and.to.be.an('array');
				const im = res.body.ims[0];
				expect(im).to.have.property('_id');
				expect(im).to.have.property('t').and.to.be.eq('d');
				expect(im).to.have.property('msgs').and.to.be.a('number');
				expect(im).to.have.property('usernames').and.to.be.an('array');
				expect(im).to.have.property('ro');
				expect(im).to.have.property('sysMes');
				expect(im).to.have.property('_updatedAt');
				expect(im).to.have.property('ts');
				expect(im).to.have.property('lastMessage');
			})
			.end(done);
	});

	describe("Setting: 'Use Real Name': true", () => {
		before(async () => updateSetting('UI_Use_Real_Name', true));
		after(async () => updateSetting('UI_Use_Real_Name', false));

		it('/im.list', (done) => {
			request
				.get(api('im.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('ims').and.to.be.an('array');

					const im = res.body.ims[0];

					expect(im).to.have.property('_id');
					expect(im).to.have.property('t').and.to.be.eq('d');
					expect(im).to.have.property('msgs').and.to.be.a('number');
					expect(im).to.have.property('usernames').and.to.be.an('array');
					expect(im).to.have.property('lm');
					expect(im).to.have.property('_updatedAt');
					expect(im).to.have.property('ts');
					expect(im).to.have.property('lastMessage');

					const { lastMessage } = im;

					expect(lastMessage).to.have.nested.property('u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});

		it('/im.list.everyone', (done) => {
			request
				.get(api('im.list.everyone'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('ims').and.to.be.an('array');
					const im = res.body.ims[0];
					expect(im).to.have.property('_id');
					expect(im).to.have.property('t').and.to.be.eq('d');
					expect(im).to.have.property('msgs').and.to.be.a('number');
					expect(im).to.have.property('usernames').and.to.be.an('array');
					expect(im).to.have.property('ro');
					expect(im).to.have.property('sysMes');
					expect(im).to.have.property('_updatedAt');
					expect(im).to.have.property('ts');
					expect(im).to.have.property('lastMessage');

					const { lastMessage } = im;

					expect(lastMessage).to.have.nested.property('u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});
	});

	it('/im.open', (done) => {
		request
			.post(api('im.open'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/im.counters', (done) => {
		request
			.get(api('im.counters'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('joined', true);
				expect(res.body).to.have.property('members');
				expect(res.body).to.have.property('unreads');
				expect(res.body).to.have.property('unreadsFrom');
				expect(res.body).to.have.property('msgs');
				expect(res.body).to.have.property('latest');
				expect(res.body).to.have.property('userMentions');
			})
			.end(done);
	});

	describe('[/im.files]', async () => {
		await testFileUploads('im.files', directMessage, 'invalid-channel');
	});

	describe('/im.messages', () => {
		it('should return all DM messages that were sent to yourself using your username', (done) => {
			request
				.get(api('im.messages'))
				.set(credentials)
				.query({
					username: adminUsername,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('/im.messages.others', () => {
		it('should fail when the endpoint is disabled', (done) => {
			updateSetting('API_Enable_Direct_Message_History_EndPoint', false).then(() => {
				request
					.get(api('im.messages.others'))
					.set(credentials)
					.query({
						roomId: directMessage._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-endpoint-disabled');
					})
					.end(done);
			});
		});
		it('should fail when the endpoint is enabled but the user doesnt have permission', (done) => {
			updateSetting('API_Enable_Direct_Message_History_EndPoint', true).then(() => {
				updatePermission('view-room-administration', []).then(() => {
					request
						.get(api('im.messages.others'))
						.set(credentials)
						.query({
							roomId: directMessage._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'unauthorized');
						})
						.end(done);
				});
			});
		});
		it('should succeed when the endpoint is enabled and user has permission', (done) => {
			updateSetting('API_Enable_Direct_Message_History_EndPoint', true).then(() => {
				updatePermission('view-room-administration', ['admin']).then(() => {
					request
						.get(api('im.messages.others'))
						.set(credentials)
						.query({
							roomId: directMessage._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('messages').and.to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('count');
							expect(res.body).to.have.property('total');
						})
						.end(done);
				});
			});
		});
	});

	it('/im.close', (done) => {
		request
			.post(api('im.close'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('fname property', () => {
		const username = `fname_${apiUsername}`;
		const name = `Name fname_${apiUsername}`;
		const updatedName = `Updated Name fname_${apiUsername}`;
		const email = `fname_${apiEmail}`;
		let userId;
		let directMessageId;
		let user;

		before((done) => {
			request
				.post(api('users.create'))
				.set(credentials)
				.send({
					email,
					name,
					username,
					password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified: true,
				})
				.expect((res) => {
					user = res.body.user;
					userId = res.body.user._id;
				})
				.end(done);
		});

		before((done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: `@${username}`,
					text: 'This message was sent using the API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
					expect(res.body).to.have.nested.property('message.rid');
					directMessageId = res.body.message.rid;
				})
				.end(done);
		});

		after(async () => deleteUser(user));

		it('should have fname property', (done) => {
			request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: directMessageId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('name', username);
					expect(res.body.subscription).to.have.property('fname', name);
				})
				.end(done);
		});

		it("should update user's name", (done) => {
			request
				.post(api('users.update'))
				.set(credentials)
				.send({
					userId,
					data: {
						name: updatedName,
					},
				})
				.expect((res) => {
					expect(res.body.user).to.have.property('name', updatedName);
				})
				.end(done);
		});

		it('should have fname property updated', (done) => {
			request
				.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: directMessageId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('name', username);
					expect(res.body.subscription).to.have.property('fname', updatedName);
				})
				.end(done);
		});
	});

	describe('/im.members', () => {
		it('should return and array with two members', (done) => {
			request
				.get(api('im.members'))
				.set(credentials)
				.query({
					roomId: directMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(2);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(2);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(2);
				})
				.end(done);
		});
		it('should return and array with one member', (done) => {
			request
				.get(api('im.members'))
				.set(credentials)
				.query({
					username: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(2);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(2);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(2);
				})
				.end(done);
		});
		it('should return and array with one member queried by status', (done) => {
			request
				.get(api('im.members'))
				.set(credentials)
				.query({
					'roomId': directMessage._id,
					'status[]': ['online'],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(1);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(1);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(1);
				})
				.end(done);
		});
	});

	describe('/im.create', () => {
		let user;
		let userCredentials;

		let otherUser;
		let otherUserCredentials;

		let thirdUser;
		let thirdUserCredentials;

		let roomIds = {};

		// Names have to be in alfabetical order so we can test the room's fullname
		const userFullName = 'User A';
		const otherUserFullName = 'User B';
		const thirdUserFullName = 'User C';

		before(async () => {
			user = await createUser({ name: userFullName });
			otherUser = await createUser({ name: otherUserFullName });
			thirdUser = await createUser({ name: thirdUserFullName });

			userCredentials = await login(user.username, password);
			otherUserCredentials = await login(otherUser.username, password);
			thirdUserCredentials = await login(thirdUser.username, password);
		});

		after(async () => {
			await Promise.all(Object.values(roomIds).map((roomId) => deleteRoom({ type: 'd', roomId })));
			await deleteUser(user);
			await deleteUser(otherUser);
			await deleteUser(thirdUser);
			user = undefined;
			otherUser = undefined;
			thirdUser = undefined;
		});

		it('creates a DM between two other parties (including self)', (done) => {
			request
				.post(api('im.create'))
				.set(userCredentials)
				.send({
					usernames: [otherUser.username, thirdUser.username].join(','),
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('usernames').and.to.have.members([thirdUser.username, user.username, otherUser.username]);
					roomIds = { ...roomIds, multipleDm: res.body.room._id };
				})
				.end(done);
		});

		it('creates a DM between two other parties (excluding self)', (done) => {
			request
				.post(api('im.create'))
				.set(credentials)
				.send({
					usernames: [user.username, otherUser.username].join(','),
					excludeSelf: true,
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('usernames').and.to.have.members([user.username, otherUser.username]);
					roomIds = { ...roomIds, dm: res.body.room._id };
				})
				.end(done);
		});

		it('should create a self-DM', (done) => {
			request
				.post(api('im.create'))
				.set(userCredentials)
				.send({
					username: user.username,
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('usernames').and.to.have.members([user.username]);
					roomIds = { ...roomIds, self: res.body.room._id };
				})
				.end(done);
		});

		describe('should create dm with correct notification preferences', () => {
			let user;
			let userCredentials;
			let userPrefRoomId;

			before(async () => {
				user = await createUser();
				userCredentials = await login(user.username, password);
			});

			after(async () => {
				if (userPrefRoomId) {
					await deleteRoom({ type: 'd', roomId: userPrefRoomId });
				}
				await deleteUser(user);
				user = undefined;
			});

			it('should save user preferences', async () => {
				await request
					.post(methodCall('saveUserPreferences'))
					.set(userCredentials)
					.send({
						message: JSON.stringify({
							id: 'id',
							msg: 'method',
							method: 'saveUserPreferences',
							params: [{ emailNotificationMode: 'nothing' }],
						}),
					})
					.expect(200);
			});

			it('should create a DM', (done) => {
				request
					.post(api('im.create'))
					.set(userCredentials)
					.send({
						usernames: [user.username, otherUser.username].join(','),
					})
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('room').and.to.be.an('object');
						expect(res.body.room).to.have.property('usernames').and.to.have.members([user.username, otherUser.username]);
						userPrefRoomId = res.body.room._id;
					})
					.end(done);
			});

			it('should return the right user notification preferences in the dm', (done) => {
				request
					.get(api('subscriptions.getOne'))
					.set(userCredentials)
					.query({
						roomId: userPrefRoomId,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('subscription').and.to.be.an('object');
						expect(res.body).to.have.nested.property('subscription.emailNotifications').and.to.be.equal('nothing');
					})
					.end(done);
			});
		});

		async function testRoomFNameForUser(testCredentials, roomId, fullName) {
			return request
				.get(api('subscriptions.getOne'))
				.set(testCredentials)
				.query({ roomId })
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('subscription').and.to.be.an('object');
					expect(res.body.subscription).to.have.property('fname', fullName);
				});
		}

		describe('Rooms fullName', () => {
			it("should be own user's name for self DM", async () => {
				await testRoomFNameForUser(userCredentials, roomIds.self, userFullName);
			});

			it("should be other user's name concatenated for multiple users's DM for every user", async () => {
				await testRoomFNameForUser(userCredentials, roomIds.multipleDm, [otherUserFullName, thirdUserFullName].join(', '));
				await testRoomFNameForUser(otherUserCredentials, roomIds.multipleDm, [userFullName, thirdUserFullName].join(', '));
				await testRoomFNameForUser(thirdUserCredentials, roomIds.multipleDm, [userFullName, otherUserFullName].join(', '));
			});

			it("should be other user's name for DM for both users", async () => {
				await testRoomFNameForUser(userCredentials, roomIds.dm, otherUserFullName);
				await testRoomFNameForUser(otherUserCredentials, roomIds.dm, userFullName);
			});
		});
	});

	describe('/im.delete', () => {
		let testDM;

		it('/im.create', (done) => {
			request
				.post(api('im.create'))
				.set(credentials)
				.send({
					username: 'rocket.cat',
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					testDM = res.body.room;
				})
				.end(done);
		});

		it('/im.delete', (done) => {
			request
				.post(api('im.delete'))
				.set(credentials)
				.send({
					username: 'rocket.cat',
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/im.open', (done) => {
			request
				.post(api('im.open'))
				.set(credentials)
				.send({
					roomId: testDM._id,
				})
				.expect(403)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		describe('when authenticated as a non-admin user', () => {
			let otherUser;
			let otherCredentials;

			before(async () => {
				otherUser = await createUser();
				otherCredentials = await login(otherUser.username, password);
			});

			after(async () => {
				await deleteUser(otherUser);
				otherUser = undefined;
			});

			it('/im.create', (done) => {
				request
					.post(api('im.create'))
					.set(credentials)
					.send({
						username: otherUser.username,
					})
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						testDM = res.body.room;
					})
					.end(done);
			});

			it('/im.delete', (done) => {
				request
					.post(api('im.delete'))
					.set(otherCredentials)
					.send({
						roomId: testDM._id,
					})
					.expect(400)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
	});
});
