import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, apiUsername, apiEmail, methodCall } from '../../data/api-data';
import { pinMessage, sendMessage, starMessage } from '../../data/chat.helper';
import { updateSetting, updatePermission } from '../../data/permissions.helper';
import { deleteRoom } from '../../data/rooms.helper';
import { testFileUploads } from '../../data/uploads.helper';
import { password, adminUsername } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login, setUserStatus } from '../../data/users.helper';

describe('[Direct Messages]', () => {
	let testDM: IRoom & { rid: IRoom['_id'] };
	let user: TestUser<IUser>;
	let directMessage: { _id: IRoom['_id'] };

	before((done) => getCredentials(done));

	before(async () => {
		user = await createUser();
		const cred = await login(user.username, password);
		await setUserStatus(cred);
		await request
			.post(api('im.create'))
			.set(credentials)
			.send({
				username: user.username,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				testDM = res.body.room;
			});
	});

	before('/chat.postMessage', (done) => {
		void request
			.post(api('chat.postMessage'))
			.set(credentials)
			.send({
				roomId: testDM.rid,
				text: 'This message was sent using the API',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
				expect(res.body).to.have.nested.property('message.rid');
				directMessage = { _id: res.body.message.rid };
			})
			.end(done);
	});

	after(() => deleteUser(user));

	describe('/im.setTopic', () => {
		it('should set the topic of the DM with a string', (done) => {
			void request
				.post(api('im.setTopic'))
				.set(credentials)
				.send({
					roomId: directMessage._id,
					topic: `a direct message with ${user.username}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', `a direct message with ${user.username}`);
				})
				.end(done);
		});
		it('should set the topic of DM with an empty string(remove the topic)', (done) => {
			void request
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
		let dmMessage: IMessage;

		it('sending a message...', (done) => {
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
					const messages = res.body.messages as IMessage[];
					const lastMessage = messages.filter((message) => message._id === dmMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred?.[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
	});

	it('/im.history', (done) => {
		void request
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
		void request
			.get(api('im.list'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
				expect(res.body).to.have.property('ims').and.to.be.an('array');
				const im = (res.body.ims as IRoom[]).find((dm) => dm._id === testDM._id);
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

	describe('/im.list.everyone', () => {
		before(async () => {
			return updatePermission('view-room-administration', ['admin']);
		});

		after(async () => {
			return updatePermission('view-room-administration', ['admin']);
		});

		it('should succesfully return a list of direct messages', async () => {
			await request
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
				});
		});

		it('should fail if user does NOT have the view-room-administration permission', async () => {
			await updatePermission('view-room-administration', []);
			await request
				.get(api('im.list.everyone'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe("Setting: 'Use Real Name': true", () => {
		before(async () => updateSetting('UI_Use_Real_Name', true));
		after(async () => updateSetting('UI_Use_Real_Name', false));

		it('/im.list', (done) => {
			void request
				.get(api('im.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('ims').and.to.be.an('array');

					const im = (res.body.ims as IRoom[]).find((dm) => dm._id === testDM._id) as IRoom;

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
			void request
				.get(api('im.list.everyone'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('ims').and.to.be.an('array');
					const im = (res.body.ims as IRoom[]).find((dm) => dm._id === testDM._id) as IRoom;
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
		void request
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

	describe('/im.counters', () => {
		it('should require auth', async () => {
			await request
				.get(api('im.counters'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
				});
		});
		it('should require a roomId', async () => {
			await request
				.get(api('im.counters'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should work with all params right', (done) => {
			void request
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

		describe('with valid room id', () => {
			let testDM: IRoom & { rid: IRoom['_id'] };
			let user2: TestUser<IUser>;
			let userCreds: Credentials;

			before(async () => {
				user2 = await createUser();
				userCreds = await login(user2.username, password);
				await request
					.post(api('im.create'))
					.set(credentials)
					.send({
						username: user2.username,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						testDM = res.body.room;
					});

				await request
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
					});
			});

			after(async () => {
				await request
					.post(api('im.delete'))
					.set(credentials)
					.send({
						roomId: testDM._id,
					})
					.expect(200);

				await deleteUser(user2);
			});

			it('should properly return counters before opening the dm', async () => {
				await request
					.get(api('im.counters'))
					.set(userCreds)
					.query({
						roomId: testDM._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('joined', true);
						expect(res.body).to.have.property('members').and.to.be.a('number').and.to.be.eq(2);
						expect(res.body).to.have.property('unreads').and.to.be.a('number').and.to.be.eq(1);
						expect(res.body).to.have.property('unreadsFrom');
						expect(res.body).to.have.property('msgs').and.to.be.a('number').and.to.be.eq(1);
						expect(res.body).to.have.property('latest');
						expect(res.body).to.have.property('userMentions').and.to.be.a('number').and.to.be.eq(0);
					});
			});
		});
	});

	describe('[/im.files]', async () => {
		await testFileUploads('im.files', 'd', 'invalid-channel');
	});

	describe('/im.messages', () => {
		let testUser: IUser;
		let testUser2: IUser;
		let testUserDMRoom: IRoom;
		let testUserCredentials: Credentials;
		let testUser2Credentials: Credentials;

		let messages: Pick<IMessage, 'rid' | 'msg' | 'mentions'>[] = [];

		before(async () => {
			[testUser, testUser2] = await Promise.all([
				createUser({ joinDefaultChannels: false, roles: ['admin'], username: `a_${Random.id()}` }),
				createUser({ joinDefaultChannels: false, username: `b_${Random.id()}` }),
			]);

			[testUserCredentials, testUser2Credentials] = await Promise.all([
				login(testUser.username, password),
				login(testUser2.username, password),
			]);
			await setUserStatus(testUserCredentials);

			testUserDMRoom = (
				await request
					.post(api('im.create'))
					.set(testUserCredentials)
					.send({ username: `${testUser2.username}` })
			).body.room;

			messages = [
				{
					rid: testUserDMRoom._id,
					msg: `@${adminUsername} youre being mentioned`,
					mentions: [{ username: adminUsername, _id: adminUsername, name: adminUsername }],
				},
				{
					rid: testUserDMRoom._id,
					msg: `@${testUser.username} youre being mentioned`,
					mentions: [{ username: testUser.username, _id: testUser._id, name: testUser.name }],
				},
				{
					rid: testUserDMRoom._id,
					msg: `A simple message`,
				},
				{
					rid: testUserDMRoom._id,
					msg: `A pinned simple message`,
				},
			];

			/**
			 * We are not using `Promise.all` here because we want to ensure that each message is sent sequentially.
			 * This approach helps in maintaining the order of messages by ts.
			 */
			const starredMessage = await sendMessage({ message: messages[0], requestCredentials: testUserCredentials });
			const pinnedMessage = await sendMessage({ message: messages[1], requestCredentials: testUser2Credentials });
			await sendMessage({ message: messages[2], requestCredentials: testUserCredentials });
			await sendMessage({ message: messages[3], requestCredentials: testUser2Credentials });

			await Promise.all([
				starMessage({ messageId: starredMessage.body.message._id, requestCredentials: testUserCredentials }),
				pinMessage({ messageId: pinnedMessage.body.message._id, requestCredentials: testUserCredentials }),
			]);
		});

		after(async () => Promise.all([deleteUser(testUser), deleteUser(testUser2)]));

		it('should return all DM messages that were sent to yourself using your username', (done) => {
			void request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
				})
				.end(done);
		});

		it('should sort by ts by default', async () => {
			await request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					roomId: testUserDMRoom._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages.map((m: IMessage) => m.u.username)).to.deep.equal(
						res.body.messages
							.sort((a: IMessage, b: IMessage) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
							.map((m: IMessage) => m.u.username),
					);
				});
		});

		it('should allow custom sorting', async () => {
			const { messages } = (
				await request
					.get(api('im.messages'))
					.set(testUserCredentials)
					.query({
						roomId: testUserDMRoom._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
			).body;

			await request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					roomId: testUserDMRoom._id,
					sort: '{"u.username":-1}',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages.map((m: IMessage) => m.u.username)).to.deep.equal(
						messages.map((m: IMessage) => m.u.username).sort((a: string, b: string) => b.localeCompare(a)),
					);
				});
		});

		it('should return an error when trying to access a DM that does not belong to the current user', async () => {
			await request
				.get(api('im.messages'))
				.set(credentials)
				.query({ roomId: testUserDMRoom._id })
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				});
		});

		it('should return messages that mention a single user', async () => {
			await request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					roomId: testUserDMRoom._id,
					mentionIds: adminUsername,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('mentions').that.is.an('array').and.to.have.lengthOf(1);
					expect(res.body.messages[0].mentions[0]).to.have.property('_id', adminUsername);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		it('should return messages that mention multiple users', async () => {
			await request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					roomId: testUserDMRoom._id,
					mentionIds: `${adminUsername},${testUser._id}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(2);
					expect(res.body).to.have.property('count', 2);
					expect(res.body).to.have.property('total', 2);

					const mentionIds = res.body.messages.map((message: any) => message.mentions[0]._id);
					expect(mentionIds).to.include.members([adminUsername, testUser._id]);
				});
		});

		it('should return messages that are starred by a specific user', async () => {
			await request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					roomId: testUserDMRoom._id,
					starredIds: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('starred').that.is.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		it('should return messages that are pinned', async () => {
			await request
				.get(api('im.messages'))
				.set(testUserCredentials)
				.query({
					roomId: testUserDMRoom._id,
					pinned: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('pinned').that.is.an('boolean').and.to.be.true;
					expect(res.body.messages[0]).to.have.nested.property('pinnedBy').that.is.an('object');
					expect(res.body.messages[0].pinnedBy).to.have.property('_id', testUser._id);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});
	});

	describe('/im.messages.others', () => {
		it('should fail when the endpoint is disabled and the user has permissions', async () => {
			await updateSetting('API_Enable_Direct_Message_History_EndPoint', false);
			await request
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
				});
		});
		it('should fail when the endpoint is disabled and the user doesnt have permission', async () => {
			await updateSetting('API_Enable_Direct_Message_History_EndPoint', false);
			await updatePermission('view-room-administration', []);
			await request
				.get(api('im.messages.others'))
				.set(credentials)
				.query({
					roomId: directMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
		it('should fail when the endpoint is enabled but the user doesnt have permission', async () => {
			await updateSetting('API_Enable_Direct_Message_History_EndPoint', true);
			await updatePermission('view-room-administration', []);
			await request
				.get(api('im.messages.others'))
				.set(credentials)
				.query({
					roomId: directMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
		it('should succeed when the endpoint is enabled and user has permission', async () => {
			await updateSetting('API_Enable_Direct_Message_History_EndPoint', true);
			await updatePermission('view-room-administration', ['admin']);
			await request
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
				});
		});
	});

	it('/im.close', (done) => {
		void request
			.post(api('im.close'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: user._id,
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
		let userId: IUser['_id'];
		let directMessageId: IMessage['_id'];
		let user: TestUser<IUser>;

		before((done) => {
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
				.get(api('im.members'))
				.set(credentials)
				.query({
					username: user.username,
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
			void request
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
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		let otherUser: TestUser<IUser>;
		let otherUserCredentials: Credentials;

		let thirdUser: TestUser<IUser>;
		let thirdUserCredentials: Credentials;

		let roomIds: Record<string, IRoom['_id']> = {};

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
		});

		it('creates a DM between two other parties (including self)', (done) => {
			void request
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
			void request
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
			void request
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
			let user: TestUser<IUser>;
			let userCredentials: Credentials;
			let userPrefRoomId: IRoom['_id'];

			before(async () => {
				user = await createUser();
				userCredentials = await login(user.username, password);
			});

			after(async () => {
				if (userPrefRoomId) {
					await deleteRoom({ type: 'd', roomId: userPrefRoomId });
				}
				await deleteUser(user);
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
				void request
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
				void request
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

		async function testRoomFNameForUser(testCredentials: Credentials, roomId: IRoom['_id'], fullName: string) {
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
		let testDM: IRoom;

		it('/im.create', (done) => {
			void request
				.post(api('im.create'))
				.set(credentials)
				.send({
					username: user.username,
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					testDM = res.body.room;
				})
				.end(done);
		});

		it('/im.delete', (done) => {
			void request
				.post(api('im.delete'))
				.set(credentials)
				.send({
					username: user.username,
				})
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/im.open', (done) => {
			void request
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
			let otherUser: TestUser<IUser>;
			let otherCredentials: Credentials;

			before(async () => {
				otherUser = await createUser();
				otherCredentials = await login(otherUser.username, password);
			});

			after(async () => {
				await deleteUser(otherUser);
			});

			it('/im.create', (done) => {
				void request
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
				void request
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
