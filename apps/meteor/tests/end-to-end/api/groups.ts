import type { Credentials } from '@rocket.chat/api-client';
import type { IIntegration, IMessage, IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import { assert, expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, apiPrivateChannelName } from '../../data/api-data';
import { pinMessage, starMessage, sendMessage } from '../../data/chat.helper';
import { CI_MAX_ROOMS_PER_GUEST as maxRoomsPerGuest } from '../../data/constants';
import { createGroup, deleteGroup } from '../../data/groups.helper';
import { createIntegration, removeIntegration } from '../../data/integration.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom } from '../../data/rooms.helper';
import { deleteTeam } from '../../data/teams.helper';
import { testFileUploads } from '../../data/uploads.helper';
import { adminUsername, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, login, deleteUser } from '../../data/users.helper';

function getRoomInfo(roomId: IRoom['_id']) {
	return new Promise<{ group: IRoom }>((resolve) => {
		void request
			.get(api('groups.info'))
			.set(credentials)
			.query({
				roomId,
			})
			.end((_err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Groups]', () => {
	let group: {
		_id: string;
		name: string;
	};

	before((done) => getCredentials(done));

	before(async () => {
		await request
			.post(api('groups.create'))
			.set(credentials)
			.send({
				name: apiPrivateChannelName,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', 0);
				group = {
					_id: res.body.group._id,
					name: res.body.group.name,
				};
			});
	});

	after(async () => {
		await request
			.post(api('groups.delete'))
			.set(credentials)
			.send({
				roomId: group._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200);
	});

	describe('/groups.create', () => {
		let guestUser: TestUser<IUser>;
		let invitedUser: TestUser<IUser>;
		let invitedUserCredentials: Credentials;
		let room: IRoom;
		let teamId: ITeam['_id'];

		before(async () => {
			guestUser = await createUser({ roles: ['guest'] });
			invitedUser = await createUser();
			invitedUserCredentials = await login(invitedUser.username, password);

			await updatePermission('create-team', ['admin', 'user']);
			const teamCreateRes = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `team-${Date.now()}`,
					type: 0,
					members: [invitedUser.username],
				});

			teamId = teamCreateRes.body.team._id;
			await updatePermission('create-team-group', ['owner']);
		});

		after(async () => {
			await deleteUser(guestUser);
			await deleteUser(invitedUser);
			await updatePermission('create-team-group', ['admin', 'owner', 'moderator']);
		});

		describe('guest users', () => {
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
							type: 'p',
							name: `channel.test.${Date.now()}-${Math.random()}`,
							members: [guestUser.username],
						}),
					);
				}
				await Promise.all(promises);

				await request
					.post(api('groups.create'))
					.set(credentials)
					.send({
						name: `channel.test.${Date.now()}-${Math.random()}`,
						members: [guestUser.username],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						room = res.body.group;
					});

				await request
					.get(api('groups.members'))
					.set(credentials)
					.query({
						roomId: room._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('members').and.to.be.an('array');
						expect(res.body.members).to.have.lengthOf(1);
					});
			});
		});

		describe('validate E2E rooms', () => {
			before(async () => {
				await Promise.all([updateSetting('E2E_Enable', true), updateSetting('E2E_Allow_Unencrypted_Messages', false)]);
			});

			after(async () => {
				await Promise.all([updateSetting('E2E_Enable', false), updateSetting('E2E_Allow_Unencrypted_Messages', true)]);
			});

			let rid: IRoom['_id'];

			it('should create a new encrypted group', async () => {
				await request
					.post(api('groups.create'))
					.set(credentials)
					.send({
						name: `encrypted-${apiPrivateChannelName}`,
						extraData: {
							encrypted: true,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('group.name', `encrypted-${apiPrivateChannelName}`);
						expect(res.body).to.have.nested.property('group.t', 'p');
						expect(res.body).to.have.nested.property('group.msgs', 0);
						expect(res.body).to.have.nested.property('group.encrypted', true);
						rid = res.body.group._id;
					});
			});

			it('should send an encrypted message in encrypted group', async () => {
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							text: 'Encrypted Message',
							t: 'e2e',
							e2e: 'pending',
							rid,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message');
						expect(res.body).to.have.nested.property('message.text', 'Encrypted Message');
						expect(res.body).to.have.nested.property('message.t', 'e2e');
						expect(res.body).to.have.nested.property('message.e2e', 'pending');
					});
			});

			it('should give an error on sending un-encrypted message in encrypted room', async () => {
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							text: 'Unencrypted Message',
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

			it('should allow sending un-encrypted messages in encrypted room when setting is enabled', async () => {
				await updateSetting('E2E_Allow_Unencrypted_Messages', true);
				await request
					.post(api('chat.sendMessage'))
					.set(credentials)
					.send({
						message: {
							text: 'Unencrypted Message',
							rid,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('message');
						expect(res.body).to.have.nested.property('message.text', 'Unencrypted Message');
					});
			});
		});

		describe('E2E enabled by default', () => {
			before(async () => {
				await Promise.all([updateSetting('E2E_Enable', true), updateSetting('E2E_Enabled_Default_PrivateRooms', true)]);
			});

			after(async () => {
				await Promise.all([updateSetting('E2E_Enable', false), updateSetting('E2E_Enabled_Default_PrivateRooms', false)]);
			});

			it('should create the encrypted room by default', async () => {
				await request
					.post(api('groups.create'))
					.set(credentials)
					.send({
						name: `default-encrypted-${apiPrivateChannelName}`,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('group.name', `default-encrypted-${apiPrivateChannelName}`);
						expect(res.body).to.have.nested.property('group.t', 'p');
						expect(res.body).to.have.nested.property('group.msgs', 0);
						expect(res.body).to.have.nested.property('group.encrypted', true);
					});
			});
		});

		it(`should fail when trying to use an existing room's name`, async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: 'general',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.nested.property('errorType', 'error-duplicate-channel-name');
				});
		});

		it('should successfully create a group in a team', async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `team-group-${Date.now()}`,
					extraData: { teamId },
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group');
					expect(res.body.group).to.have.property('teamId', teamId);
				});
		});

		it('should fail creating a group in a team when member does not have the necessary permission', async () => {
			await request
				.post(api('groups.create'))
				.set(invitedUserCredentials)
				.send({
					name: `team-group-${Date.now()}`,
					extraData: { teamId },
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});
		});
	});

	describe('/groups.info', () => {
		let testGroup: IRoom;

		const newGroupInfoName = `info-private-channel-test-${Date.now()}`;

		before('creating new group...', async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: newGroupInfoName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testGroup = res.body.group;
				});
		});

		after('deleting group...', async () => {
			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: newGroupInfoName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should return group basic structure', async () => {
			await request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', newGroupInfoName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
				});
		});

		let groupMessage: IMessage;

		it('sending a message...', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: testGroup._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					groupMessage = res.body.message;
				});
		});

		it('REACTing with last message', async () => {
			await request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: groupMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('STARring last message', async () => {
			await request
				.post(api('chat.starMessage'))
				.set(credentials)
				.send({
					messageId: groupMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('PINning last message', async () => {
			await request
				.post(api('chat.pinMessage'))
				.set(credentials)
				.send({
					messageId: groupMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return group structure with "lastMessage" object including pin, reaction and star(should be an array) infos', async () => {
			await request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group').and.to.be.an('object');
					const { group } = res.body;
					expect(group).to.have.property('lastMessage').and.to.be.an('object');
					expect(group.lastMessage).to.have.property('reactions').and.to.be.an('object');
					expect(group.lastMessage).to.have.property('pinned').and.to.be.a('boolean');
					expect(group.lastMessage).to.have.property('pinnedAt').and.to.be.a('string');
					expect(group.lastMessage).to.have.property('pinnedBy').and.to.be.an('object');
					expect(group.lastMessage).to.have.property('starred').and.to.be.an('array');
				});
		});
		it('should return all groups messages where the last message of array should have the "star" array with USERS star ONLY', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const messages = res.body.messages as IMessage[];
					const lastMessage = messages.filter((message) => message._id === groupMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred?.[0]._id).to.be.equal(adminUsername);
				});
		});

		it('should return all groups messages where the last message of array should have the "star" array with USERS star ONLY even requested with count and offset params', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const messages = res.body.messages as IMessage[];
					const lastMessage = messages.filter((message) => message._id === groupMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred?.[0]._id).to.be.equal(adminUsername);
				});
		});
	});

	describe('/groups.messages', () => {
		let testGroup: IRoom;
		let firstUser: IUser;
		let secondUser: IUser;

		before(async () => {
			testGroup = (await createGroup({ name: `test-group-${Date.now()}` })).body.group;
			firstUser = await createUser({ joinDefaultChannels: false });
			secondUser = await createUser({ joinDefaultChannels: false });

			const messages = [
				{
					rid: testGroup._id,
					msg: `@${firstUser.username} youre being mentioned`,
					mentions: [{ username: firstUser.username, _id: firstUser._id, name: firstUser.name }],
				},
				{
					rid: testGroup._id,
					msg: `@${secondUser.username} youre being mentioned`,
					mentions: [{ username: secondUser.username, _id: secondUser._id, name: secondUser.name }],
				},
				{
					rid: testGroup._id,
					msg: `A simple message`,
				},
				{
					rid: testGroup._id,
					msg: `A pinned simple message`,
				},
			];

			const [, , starredMessage, pinnedMessage] = await Promise.all(messages.map((message) => sendMessage({ message })));

			await Promise.all([
				starMessage({ messageId: starredMessage.body.message._id }),
				pinMessage({ messageId: pinnedMessage.body.message._id }),
			]);
		});

		after(async () => {
			await deleteGroup({ roomName: testGroup.name });
		});

		it('should return all messages from a group', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({ roomId: testGroup._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					expect(res.body.messages).to.have.lengthOf(5);
				});
		});

		it('should return messages that mention a single user', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
					mentionIds: firstUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('mentions').that.is.an('array').and.to.have.lengthOf(1);
					expect(res.body.messages[0].mentions[0]).to.have.property('_id', firstUser._id);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		it('should return messages that mention multiple users', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
					mentionIds: `${firstUser._id},${secondUser._id}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(2);
					expect(res.body).to.have.property('count', 2);
					expect(res.body).to.have.property('total', 2);

					const mentionIds = res.body.messages.map((message: any) => message.mentions[0]._id);
					expect(mentionIds).to.include.members([firstUser._id, secondUser._id]);
				});
		});

		it('should return messages that are starred by a specific user', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
					starredIds: 'rocketchat.internal.admin.test',
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
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
					pinned: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('pinned').that.is.an('boolean').and.to.be.true;
					expect(res.body.messages[0]).to.have.nested.property('pinnedBy').that.is.an('object');
					expect(res.body.messages[0].pinnedBy).to.have.property('_id', 'rocketchat.internal.admin.test');
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		it('should return all messages from a group using roomName parameter', async () => {
			await request
				.get(api('groups.messages'))
				.set(credentials)
				.query({ roomName: testGroup.name })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					expect(res.body.messages).to.have.lengthOf(5);
				});
		});

		it('should return error if both roomId and roomName are provided', async () => {
			const thirdGroup = (await createGroup({ name: `test-priority-${Date.now()}` })).body.group;
			const secondGroup = (await createGroup({ name: `test-priority-${Date.now()}` })).body.group;

			try {
				await request
					.get(api('groups.messages'))
					.set(credentials)
					.query({
						roomId: thirdGroup._id,
						roomName: secondGroup.name,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'invalid-params');
					});
			} finally {
				await Promise.all([deleteGroup({ roomName: secondGroup.name }), deleteGroup({ roomName: thirdGroup.name })]);
			}
		});
	});

	describe('/groups.invite', async () => {
		let roomInfo: { group: IRoom };

		before(async () => {
			roomInfo = await getRoomInfo(group._id);
		});

		it('should invite user to group', async () => {
			await request
				.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
				});
		});
	});

	describe('/groups.addModerator', () => {
		it('should make user a moderator', (done) => {
			void request
				.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.removeModerator', () => {
		it('should remove user from moderator', (done) => {
			void request
				.post(api('groups.removeModerator'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.addOwner', () => {
		it('should add user as owner', (done) => {
			void request
				.post(api('groups.addOwner'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.removeOwner', () => {
		it('should remove user from owner', (done) => {
			void request
				.post(api('groups.removeOwner'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.addLeader', () => {
		it('should add user as leader', (done) => {
			void request
				.post(api('groups.addLeader'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.removeLeader', () => {
		it('should remove user from leader', (done) => {
			void request
				.post(api('groups.removeLeader'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.kick', () => {
		let testUserModerator: TestUser<IUser>;
		let credsModerator: Credentials;
		let testUserOwner: TestUser<IUser>;
		let credsOwner: Credentials;
		let testUserMember: TestUser<IUser>;
		let groupTest: IRoom;

		const inviteUser = async (userId: IUser['_id']) => {
			await request
				.post(api('groups.invite'))
				.set(credsOwner)
				.send({
					roomId: groupTest._id,
					userId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		};

		before(async () => {
			// had to do them in serie because calling them with Promise.all was failing some times
			testUserModerator = await createUser();
			testUserOwner = await createUser();
			testUserMember = await createUser();

			credsModerator = await login(testUserModerator.username, password);
			credsOwner = await login(testUserOwner.username, password);

			await request
				.post(api('groups.create'))
				.set(credsOwner)
				.send({
					name: `kick-test-group-${Date.now()}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					groupTest = res.body.group;
				});

			await inviteUser(testUserModerator._id);

			await request
				.post(api('groups.addModerator'))
				.set(credsOwner)
				.send({
					roomId: groupTest._id,
					userId: testUserModerator._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		after(async () => {
			await Promise.all([
				request
					.post(api('groups.delete'))
					.set(credsOwner)
					.send({
						roomId: groupTest._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200),
				updatePermission('kick-user-from-any-p-room', []),
				updatePermission('remove-user', ['admin', 'owner', 'moderator']),
				deleteUser(testUserModerator),
				deleteUser(testUserOwner),
				deleteUser(testUserMember),
			]);
		});

		it("should return an error when user is not a member of the group and doesn't have permission", async () => {
			await updatePermission('kick-user-from-any-p-room', []);
			await request
				.post(api('groups.kick'))
				.set(credentials)
				.send({
					roomId: groupTest._id,
					userId: testUserMember._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-room-not-found');
				});
		});

		it('should allow a moderator to remove user from group', async () => {
			await inviteUser(testUserMember._id);

			await request
				.post(api('groups.kick'))
				.set(credsModerator)
				.send({
					roomId: groupTest._id,
					userId: testUserMember._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should allow an owner to remove user from group', async () => {
			await inviteUser(testUserMember._id);

			await request
				.post(api('groups.kick'))
				.set(credsOwner)
				.send({
					roomId: groupTest._id,
					userId: testUserMember._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should kick user from group if not a member of the room but has the required permission', async () => {
			await updatePermission('kick-user-from-any-p-room', ['admin']);
			await inviteUser(testUserMember._id);

			await request
				.post(api('groups.kick'))
				.set(credentials)
				.send({
					roomId: group._id,
					userId: testUserMember._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it("should return an error when the owner doesn't have the required permission", async () => {
			await updatePermission('remove-user', ['admin', 'moderator']);
			await inviteUser(testUserMember._id);

			await request
				.post(api('groups.kick'))
				.set(credsOwner)
				.send({
					roomId: groupTest._id,
					userId: testUserMember._id,
				})
				.expect('Content-Type', 'application/json')

				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});
		});

		it('should return an error when trying to kick the last owner from a group', async () => {
			await updatePermission('kick-user-from-any-p-room', ['admin']);

			await request
				.post(api('groups.kick'))
				.set(credentials)
				.send({
					roomId: groupTest._id,
					userId: testUserOwner._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-you-are-last-owner');
				});
		});

		it('should return an error when trying to kick user that does not exist');
		it('should return an error when trying to kick user from a group that does not exist');
		it('should return an error when trying to kick user from a group that the user is not in the room');
	});

	describe('/groups.setDescription', () => {
		it('should set the description of the group with a string', (done) => {
			void request
				.post(api('groups.setDescription'))
				.set(credentials)
				.send({
					roomId: group._id,
					description: 'this is a description for a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('description', 'this is a description for a channel for api tests');
				})
				.end(done);
		});
		it('should set the description of the group with an empty string(remove the description)', (done) => {
			void request
				.post(api('groups.setDescription'))
				.set(credentials)
				.send({
					roomId: group._id,
					description: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('description', '');
				})
				.end(done);
		});
	});

	describe('/groups.setTopic', () => {
		it('should set the topic of the group with a string', (done) => {
			void request
				.post(api('groups.setTopic'))
				.set(credentials)
				.send({
					roomId: group._id,
					topic: 'this is a topic of a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', 'this is a topic of a channel for api tests');
				})
				.end(done);
		});
		it('should set the topic of the group with an empty string(remove the topic)', (done) => {
			void request
				.post(api('groups.setTopic'))
				.set(credentials)
				.send({
					roomId: group._id,
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

	describe('/groups.setPurpose', () => {
		it('should set the purpose of the group with a string', (done) => {
			void request
				.post(api('groups.setPurpose'))
				.set(credentials)
				.send({
					roomId: group._id,
					purpose: 'this is a purpose of a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('purpose', 'this is a purpose of a channel for api tests');
				})
				.end(done);
		});
		it('should set the purpose of the group with an empty string(remove the purpose)', (done) => {
			void request
				.post(api('groups.setPurpose'))
				.set(credentials)
				.send({
					roomId: group._id,
					purpose: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('purpose', '');
				})
				.end(done);
		});
	});

	describe('/groups.history', () => {
		it('should return groups history when searching by roomId', (done) => {
			void request
				.get(api('groups.history'))
				.set(credentials)
				.query({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
		it('should return groups history when searching by roomId even requested with count and offset params', (done) => {
			void request
				.get(api('groups.history'))
				.set(credentials)
				.query({
					roomId: group._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
	});

	describe('/groups.archive', () => {
		it('should archive the group', (done) => {
			void request
				.post(api('groups.archive'))
				.set(credentials)
				.send({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.unarchive', () => {
		it('should unarchive the group', (done) => {
			void request
				.post(api('groups.unarchive'))
				.set(credentials)
				.send({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.close', () => {
		it('should close the group', (done) => {
			void request
				.post(api('groups.close'))
				.set(credentials)
				.send({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return an error when trying to close a private group that is already closed', (done) => {
			void request
				.post(api('groups.close'))
				.set(credentials)
				.send({
					roomName: apiPrivateChannelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', `The private group, ${apiPrivateChannelName}, is already closed to the sender`);
				})
				.end(done);
		});
	});

	describe('/groups.open', () => {
		it('should open the group', (done) => {
			void request
				.post(api('groups.open'))
				.set(credentials)
				.send({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.list', () => {
		it('should list the groups the caller is part of', (done) => {
			void request
				.get(api('groups.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('groups').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return a list of zero length if not a member of any group', async () => {
			const user = await createUser();
			const newCreds = await login(user.username, password);
			await request
				.get(api('groups.list'))
				.set(newCreds)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.equal(0);
					expect(res.body).to.have.property('total').and.to.equal(0);
					expect(res.body).to.have.property('groups').and.to.be.an('array').and.that.has.lengthOf(0);
				});
		});
	});

	describe('/groups.online', () => {
		const createUserAndChannel = async (setAsOnline = true) => {
			const testUser = await createUser();
			const testUserCredentials = await login(testUser.username, password);

			if (setAsOnline) {
				await request.post(api('users.setStatus')).set(testUserCredentials).send({
					message: '',
					status: 'online',
				});
			}

			const roomName = `group-test-${Date.now()}`;

			const roomResponse = await createRoom({
				name: roomName,
				type: 'p',
				members: [testUser.username],
				credentials: testUserCredentials,
			});

			return {
				testUser,
				testUserCredentials,
				room: roomResponse.body.group,
			};
		};

		it('should return an error if no query', () =>
			request
				.get(api('groups.online'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid query');
				}));

		it('should return an error if passing an empty query', () =>
			request
				.get(api('groups.online'))
				.set(credentials)
				.query('query={}')
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid query');
				}));

		it('should return an array with online members', async () => {
			const { testUser, testUserCredentials, room } = await createUserAndChannel();

			const response = await request.get(api('groups.online')).set(testUserCredentials).query({
				_id: room._id,
			});

			const { body } = response;

			const expected = {
				_id: testUser._id,
				username: testUser.username,
			};

			expect(body.online).to.deep.include(expected);
		});

		it('should return an empty array if members are offline', async () => {
			const { testUserCredentials, room } = await createUserAndChannel(false);

			const response = await request.get(api('groups.online')).set(testUserCredentials).query({
				_id: room._id,
			});

			const { body } = response;

			expect(body.online).to.deep.equal([]);
		});

		it('should return an error if requesting user is not in group', async () => {
			const outsider = await createUser();
			const outsiderCredentials = await login(outsider.username, password);

			const { room } = await createUserAndChannel();

			await request
				.get(api('groups.online'))
				.set(outsiderCredentials)
				.query({
					_id: room._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});
		});
	});

	describe('/groups.members', () => {
		it('should return group members when searching by roomId', (done) => {
			void request
				.get(api('groups.members'))
				.set(credentials)
				.query({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('members').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return group members when searching by roomId even requested with count and offset params', (done) => {
			void request
				.get(api('groups.members'))
				.set(credentials)
				.query({
					roomId: group._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('members').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('/groups.files', async () => {
		await testFileUploads('groups.files', 'p');
	});

	describe('/groups.listAll', () => {
		before(async () => {
			return updatePermission('view-room-administration', ['admin']);
		});

		after(async () => {
			return updatePermission('view-room-administration', ['admin']);
		});

		it('should succeed if user has view-room-administration permission', async () => {
			await request
				.get(api('groups.listAll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('groups').and.to.be.an('array');
				});
		});

		it('should fail if the user doesnt have view-room-administration permission', async () => {
			await updatePermission('view-room-administration', []);
			await request
				.get(api('groups.listAll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('/groups.counters', () => {
		it('should return group counters', (done) => {
			void request
				.get(api('groups.counters'))
				.set(credentials)
				.query({
					roomId: group._id,
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
	});

	describe('/groups.rename', async () => {
		let roomInfo: { group: IRoom };
		before(async () => {
			roomInfo = await getRoomInfo(group._id);
		});

		it('should return the group rename with an additional message', async () => {
			await request
				.post(api('groups.rename'))
				.set(credentials)
				.send({
					roomId: group._id,
					name: `EDITED${apiPrivateChannelName}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', `EDITED${apiPrivateChannelName}`);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
				});
		});
	});

	describe('/groups.getIntegrations', () => {
		let integrationCreatedByAnUser: IIntegration;
		let createdGroup: IRoom;

		before(async () => {
			const resRoom = await createRoom({ name: `test-integration-group-${Date.now()}`, type: 'p' });

			createdGroup = resRoom.body.group;

			const user = await createUser();

			const userCredentials = await login(user.username, password);

			await Promise.all([
				updatePermission('manage-incoming-integrations', ['user']),
				updatePermission('manage-own-incoming-integrations', ['user']),
			]);

			integrationCreatedByAnUser = await createIntegration(
				{
					type: 'webhook-incoming',
					name: 'Incoming test',
					enabled: true,
					alias: 'test',
					username: 'rocket.cat',
					scriptEnabled: false,
					overrideDestinationChannelEnabled: true,
					channel: `#${createdGroup.name}`,
				},
				userCredentials,
			);
		});

		after(async () => {
			await removeIntegration(integrationCreatedByAnUser._id, 'incoming');

			await Promise.all([
				updatePermission('manage-incoming-integrations', ['admin']),
				updatePermission('manage-outgoing-integrations', ['admin']),
				updatePermission('manage-own-incoming-integrations', ['admin']),
				updatePermission('manage-own-outgoing-integrations', ['admin']),
			]);
		});

		it('should return the list of integrations of create group and it should contain the integration created by user when the admin DOES have the permission', async () => {
			await updatePermission('manage-incoming-integrations', ['admin']);

			await request
				.get(api('groups.getIntegrations'))
				.set(credentials)
				.query({
					roomId: createdGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const integrationCreated = (res.body.integrations as IIntegration[]).find(
						(createdIntegration) => createdIntegration._id === integrationCreatedByAnUser._id,
					);
					assert.isDefined(integrationCreated);
					expect(integrationCreated).to.be.an('object');
					expect(integrationCreated._id).to.be.equal(integrationCreatedByAnUser._id);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
				});
		});

		it('should return the list of integrations created by the user only', async () => {
			await Promise.all([
				updatePermission('manage-own-incoming-integrations', ['admin']),
				updatePermission('manage-incoming-integrations', []),
			]);

			await request
				.get(api('groups.getIntegrations'))
				.set(credentials)
				.query({
					roomId: createdGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const integrationCreated = (res.body.integrations as IIntegration[]).find(
						(createdIntegration) => createdIntegration._id === integrationCreatedByAnUser._id,
					);
					expect(integrationCreated).to.be.equal(undefined);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
				});
		});

		it('should return unauthorized error when the user does not have any integrations permissions', async () => {
			await Promise.all([
				updatePermission('manage-incoming-integrations', []),
				updatePermission('manage-outgoing-integrations', []),
				updatePermission('manage-own-incoming-integrations', []),
				updatePermission('manage-own-outgoing-integrations', []),
			]);

			await request
				.get(api('groups.getIntegrations'))
				.set(credentials)
				.query({
					roomId: createdGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('/groups.setReadOnly', () => {
		it('should set the group as read only', (done) => {
			void request
				.post(api('groups.setReadOnly'))
				.set(credentials)
				.send({
					roomId: group._id,
					readOnly: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe.skip('/groups.leave', () => {
		it('should allow the user to leave the group', (done) => {
			void request
				.post(api('groups.leave'))
				.set(credentials)
				.send({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.setAnnouncement', () => {
		it('should set the announcement of the group with a string', (done) => {
			void request
				.post(api('groups.setAnnouncement'))
				.set(credentials)
				.send({
					roomId: group._id,
					announcement: 'this is an announcement of a group for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('announcement', 'this is an announcement of a group for api tests');
				})
				.end(done);
		});
		it('should set the announcement of the group with an empty string(remove the announcement)', (done) => {
			void request
				.post(api('groups.setAnnouncement'))
				.set(credentials)
				.send({
					roomId: group._id,
					announcement: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('announcement', '');
				})
				.end(done);
		});
	});

	describe('/groups.setType', () => {
		let roomTypeId: IRoom['_id'];

		before(async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.type.${Date.now()}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);

					roomTypeId = res.body.group._id;
				});
		});

		after(async () => {
			await request
				.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomId: roomTypeId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should change the type of the group to a channel', async () => {
			await request
				.post(api('groups.setType'))
				.set(credentials)
				.send({
					roomId: roomTypeId,
					type: 'c',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.t', 'c');
				});
		});
	});

	describe('/groups.setCustomFields', () => {
		let cfchannel: IRoom;
		let groupWithoutCustomFields: IRoom;

		before('create group with customFields', async () => {
			const customFields = { field0: 'value0' };

			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
					customFields,
				})
				.expect((res) => {
					cfchannel = res.body.group;
				});

			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
				})
				.expect((res) => {
					groupWithoutCustomFields = res.body.group;
				});
		});

		after('delete group with customFields', async () => {
			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: groupWithoutCustomFields.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('get customFields using groups.info', (done) => {
			void request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.customFields.field0', 'value0');
				})
				.end(done);
		});
		it('change customFields', async () => {
			const customFields = { field9: 'value9' };
			await request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', cfchannel.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field9', 'value9');
					expect(res.body).to.have.not.nested.property('group.customFields.field0', 'value0');
				});
		});
		it('get customFields using groups.info', (done) => {
			void request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.customFields.field9', 'value9');
				})
				.end(done);
		});

		it('set customFields with one nested field', async () => {
			const customFields = { field1: 'value1' };
			await request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomId: groupWithoutCustomFields._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', groupWithoutCustomFields.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field1', 'value1');
				});
		});
		it('set customFields with multiple nested fields', async () => {
			const customFields = { field2: 'value2', field3: 'value3', field4: 'value4' };

			await request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: groupWithoutCustomFields.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', groupWithoutCustomFields.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field2', 'value2');
					expect(res.body).to.have.nested.property('group.customFields.field3', 'value3');
					expect(res.body).to.have.nested.property('group.customFields.field4', 'value4');
					expect(res.body).to.have.not.nested.property('group.customFields.field1', 'value1');
				});
		});
		it('set customFields to empty object', async () => {
			const customFields = {};

			await request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: groupWithoutCustomFields.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', groupWithoutCustomFields.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.not.nested.property('group.customFields.field2', 'value2');
					expect(res.body).to.have.not.nested.property('group.customFields.field3', 'value3');
					expect(res.body).to.have.not.nested.property('group.customFields.field4', 'value4');
				});
		});
		it('set customFields as a string -> should return 400', (done) => {
			const customFields = '';

			void request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: groupWithoutCustomFields.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('/groups.delete', () => {
		let testGroup: IRoom;
		let testTeamGroup: IRoom;
		let testModeratorTeamGroup: IRoom;
		let invitedUser: TestUser<IUser>;
		let moderatorUser: TestUser<IUser>;
		let invitedUserCredentials: Credentials;
		let moderatorUserCredentials: Credentials;
		let teamId: ITeam['_id'];
		let teamMainRoomId: IRoom['_id'];

		before(async () => {
			testGroup = (await createRoom({ name: `group.test.${Date.now()}`, type: 'p' })).body.group;
			invitedUser = await createUser();
			moderatorUser = await createUser();
			invitedUserCredentials = await login(invitedUser.username, password);
			moderatorUserCredentials = await login(moderatorUser.username, password);

			const teamCreateRes = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `team-${Date.now()}`,
					type: 1,
					members: [invitedUser.username, moderatorUser.username],
				});
			teamId = teamCreateRes.body.team._id;
			teamMainRoomId = teamCreateRes.body.team.roomId;

			await updatePermission('delete-team-group', ['owner', 'moderator']);
			await updatePermission('create-team-group', ['admin', 'owner', 'moderator', 'user']);
			const teamGroupResponse = await createRoom({
				name: `group.test.${Date.now()}`,
				type: 'p',
				extraData: { teamId },
				credentials: invitedUserCredentials,
			});
			testTeamGroup = teamGroupResponse.body.group;

			await request
				.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					userId: moderatorUser._id,
					roomId: teamMainRoomId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
			const teamModeratorGroupResponse = await createRoom({
				name: `group.test.moderator.${Date.now()}`,
				type: 'p',
				extraData: { teamId },
				credentials: moderatorUserCredentials,
			});
			testModeratorTeamGroup = teamModeratorGroupResponse.body.group;
		});
		after(async () => {
			await deleteUser(invitedUser);
			await deleteUser(moderatorUser);
			await updatePermission('create-team-group', ['admin', 'owner', 'moderator']);
			await updatePermission('delete-team-group', ['admin', 'owner', 'moderator']);
		});
		it('should succesfully delete a group', async () => {
			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: testGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		it(`should fail retrieving a group's info after it's been deleted`, async () => {
			await request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-room-not-found');
				});
		});
		it(`should fail deleting a team's group when member does not have the necessary permission in the team`, async () => {
			await request
				.post(api('groups.delete'))
				.set(invitedUserCredentials)
				.send({
					roomName: testTeamGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.a.property('error');
					expect(res.body).to.have.a.property('errorType', 'error-not-allowed');
				});
		});
		it(`should fail deleting a team's group when member has the necessary permission in the team, but not in the deleted room`, async () => {
			await request
				.post(api('groups.delete'))
				.set(moderatorUserCredentials)
				.send({
					roomName: testTeamGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.a.property('error');
					expect(res.body).to.have.a.property('errorType', 'error-room-not-found');
				});
		});
		it(`should successfully delete a team's group when member has both team and group permissions`, async () => {
			await request
				.post(api('groups.delete'))
				.set(moderatorUserCredentials)
				.send({
					roomId: testModeratorTeamGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	describe('/groups.roles', () => {
		let testGroup: IRoom;
		before(async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.roles.test.${Date.now()}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testGroup = res.body.group;
				});
		});

		after(async () => {
			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: testGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('/groups.invite', (done) => {
			void request
				.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/groups.addModerator', (done) => {
			void request
				.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/groups.addLeader', (done) => {
			void request
				.post(api('groups.addLeader'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of roles <-> user relationships in a private group', (done) => {
			void request
				.get(api('groups.roles'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('roles').that.is.an('array').that.has.lengthOf(2);

					expect(res.body.roles[0]).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[0]).to.have.a.property('rid').that.is.equal(testGroup._id);
					expect(res.body.roles[0]).to.have.a.property('roles').that.is.an('array').that.includes('moderator', 'leader');
					expect(res.body.roles[0]).to.have.a.property('u').that.is.an('object');
					expect(res.body.roles[0].u).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[0].u).to.have.a.property('username').that.is.a('string');

					expect(res.body.roles[1]).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[1]).to.have.a.property('rid').that.is.equal(testGroup._id);
					expect(res.body.roles[1]).to.have.a.property('roles').that.is.an('array').that.includes('owner');
					expect(res.body.roles[1]).to.have.a.property('u').that.is.an('object');
					expect(res.body.roles[1].u).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[1].u).to.have.a.property('username').that.is.a('string');
				})
				.end(done);
		});
	});

	describe('/groups.moderators', () => {
		let testGroup: IRoom;
		before(async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.roles.test.${Date.now()}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testGroup = res.body.group;
				});
		});

		after(async () => {
			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: testGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('/groups.invite', (done) => {
			void request
				.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/groups.addModerator', (done) => {
			void request
				.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of moderators with rocket.cat as a moderator', (done) => {
			void request
				.get(api('groups.moderators'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('moderators').that.is.an('array').that.has.lengthOf(1);
					expect(res.body.moderators[0].username).to.be.equal('rocket.cat');
				})
				.end(done);
		});
	});

	describe('/groups.setEncrypted', () => {
		let testGroup: IRoom;

		before(async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.encrypted.test.${Date.now()}`,
				})
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');

					testGroup = res.body.group;
				});

			await updateSetting('E2E_Enable', true);
		});

		after(async () => {
			await updateSetting('E2E_Enable', false);

			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: testGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		it('should return an error when passing no boolean param', (done) => {
			void request
				.post(api('groups.setEncrypted'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					encrypted: 'no-boolean',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The bodyParam "encrypted" is required');
				})
				.end(done);
		});

		it('should set group as encrypted correctly and return the new data', (done) => {
			void request
				.post(api('groups.setEncrypted'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					encrypted: true,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group');
					expect(res.body.group).to.have.property('_id', testGroup._id);
					expect(res.body.group).to.have.property('encrypted', true);
				})
				.end(done);
		});

		it('should return the updated room encrypted', async () => {
			const roomInfo = await getRoomInfo(testGroup._id);
			expect(roomInfo).to.have.a.property('success', true);
			expect(roomInfo.group).to.have.a.property('_id', testGroup._id);
			expect(roomInfo.group).to.have.a.property('encrypted', true);
		});

		it('should set group as unencrypted correctly and return the new data', (done) => {
			void request
				.post(api('groups.setEncrypted'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					encrypted: false,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group');
					expect(res.body.group).to.have.property('_id', testGroup._id);
					expect(res.body.group).to.have.property('encrypted', false);
				})
				.end(done);
		});

		it('should return the updated room unencrypted', async () => {
			const roomInfo = await getRoomInfo(testGroup._id);
			expect(roomInfo).to.have.a.property('success', true);
			expect(roomInfo.group).to.have.a.property('_id', testGroup._id);
			expect(roomInfo.group).to.have.a.property('encrypted', false);
		});
	});

	describe('/groups.convertToTeam', () => {
		let newGroup: IRoom;

		before(async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `group-${Date.now()}` })
				.expect(200)
				.expect((response) => {
					newGroup = response.body.group;
				});
		});

		after(() => {
			assert.isDefined(newGroup.name);
			return Promise.all([deleteTeam(credentials, newGroup.name), updatePermission('create-team', ['admin', 'user'])]);
		});

		it('should fail to convert group if lacking edit-room permission', (done) => {
			void updatePermission('create-team', []).then(() => {
				void updatePermission('edit-room', ['admin']).then(() => {
					void request
						.post(api('groups.convertToTeam'))
						.set(credentials)
						.send({ roomId: newGroup._id })
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should fail to convert group if lacking create-team permission', (done) => {
			void updatePermission('create-team', ['admin']).then(() => {
				void updatePermission('edit-room', []).then(() => {
					void request
						.post(api('groups.convertToTeam'))
						.set(credentials)
						.send({ roomId: newGroup._id })
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should successfully convert a group to a team', (done) => {
			void updatePermission('create-team', ['admin']).then(() => {
				void updatePermission('edit-room', ['admin']).then(() => {
					void request
						.post(api('groups.convertToTeam'))
						.set(credentials)
						.send({ roomId: newGroup._id })
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should fail to convert group without the required parameters', (done) => {
			void request.post(api('groups.convertToTeam')).set(credentials).send({}).expect(400).end(done);
		});

		it("should fail to convert group if it's already taken", (done) => {
			void request
				.post(api('groups.convertToTeam'))
				.set(credentials)
				.send({ roomId: newGroup._id })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				})
				.end(done);
		});
	});

	describe("Setting: 'Use Real Name': true", () => {
		let realNameGroup: IRoom;

		before(async () => {
			await updateSetting('UI_Use_Real_Name', true);

			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `group-${Date.now()}` })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);

					realNameGroup = res.body.group;
				});

			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: realNameGroup._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		after(async () => {
			await updateSetting('UI_Use_Real_Name', false);

			await request
				.post(api('groups.delete'))
				.set(credentials)
				.send({ roomId: realNameGroup._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return the last message user real name', (done) => {
			void request
				.get(api('groups.info'))
				.query({
					roomId: realNameGroup._id,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const { group } = res.body;

					expect(group._id).to.be.equal(realNameGroup._id);
					expect(group).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});
	});
});
