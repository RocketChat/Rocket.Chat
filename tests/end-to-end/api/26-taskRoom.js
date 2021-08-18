import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper.js';
import { password } from '../../data/user';

describe('[TaskRoom]', () => {
	before((done) => getCredentials(done));

	const community = `community${ Date.now() }`;
	let testUser;
	const testUserCredentials = {};

	before('Create test users', (done) => {
		let username = `user.test.${ Date.now() }`;
		let email = `${ username }@rocket.chat`;
		request.post(api('users.create'))
			.set(credentials)
			.send({ email, name: username, username, password: username, roles: ['user'] })
			.then((res) => {
				testUser = res.body.user;

				username = `user.test.${ Date.now() }`;
				email = `${ username }@rocket.chat`;
				request.post(api('users.create'))
					.set(credentials)
					.send({ email, name: username, username, password: username })
					.end(() => {
						done();
					});
			});
	});

	before('login testUser', (done) => {
		request.post(api('login'))
			.send({
				user: testUser.username,
				password: testUser.username,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				testUserCredentials['X-Auth-Token'] = res.body.data.authToken;
				testUserCredentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

	describe('/taskRoom.create', () => {
		it('should create a public taskRoom', (done) => {
			request.post(api('taskRoom.create'))
				.set(credentials)
				.send({
					name: community,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('taskRoom.taskRoomId');
				})
				.end(done);
		});

		it('should create private taskRoom with a defined owner', (done) => {
			request.post(api('taskRoom.create'))
				.set(credentials)
				.send({
					name: `test-taskRoom-${ Date.now() }`,
					type: 1,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('taskRoom.taskRoomId');
				})
				.then(() => done())
				.catch(done);
		});

		it('should throw an error if the taskRoom already exists', (done) => {
			request.post(api('taskRoom.create'))
				.set(credentials)
				.send({
					name: community,
					type: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('room-name-already-exists');
				})
				.end(done);
		});
	});


	describe('/taskRoom.createTask', () => {
		it('should throw an error when the required param \'rid\' is not sent', (done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					title: 'Test title',
					taskDescription: 'Test description',
					taskAssignee: '@UserTest',
					taskStatus: 'Team A',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'the rid property is missing');
				})
				.end(done);
		});

		it('should throw an error when the required param \'title\' is not sent', (done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					title: '',
					description: 'Test description',
					taskAssignee: '@UserTest',
					taskStatus: 'Team A',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'task title is missing');
				})
				.end(done);
		});

		it('should create a task successfully', (done) => {
			const task = {};
			task._id = `id-${ Date.now() }`;
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					title: 'Test title',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('task.title', 'Test title');
				})
				.end(done);
		});

		describe('Read only channel', () => {
			let readOnlyChannel;

			const userCredentials = {};
			let user;
			before((done) => {
				const username = `user.test.readonly.${ Date.now() }`;
				const email = `${ username }@rocket.chat`;
				request.post(api('users.create'))
					.set(credentials)
					.send({ email, name: username, username, password })
					.end((err, res) => {
						user = res.body.user;
						request.post(api('login'))
							.send({
								user: username,
								password,
							})
							.expect('Content-Type', 'application/json')
							.expect(200)
							.expect((res) => {
								userCredentials['X-Auth-Token'] = res.body.data.authToken;
								userCredentials['X-User-Id'] = res.body.data.userId;
							})
							.end(done);
					});
			});

			it('Creating a read-only channel', (done) => {
				request.post(api('taskRoom.create'))
					.set(credentials)
					.send({
						name: `readonlychannel${ +new Date() }`,
						room: {
							readOnly: true,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						readOnlyChannel = res.body.taskRoom;
					})
					.end(done);
			});
			it('should create a task when the user is the owner of a readonly channel', (done) => {
				request.post(api('taskRoom.createTask'))
					.set(credentials)
					.send({
						rid: readOnlyChannel.roomId,
						title: 'Test title',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('task').and.to.be.an('object');
					})
					.end(done);
			});
			it('Inviting regular user to read-only channel', (done) => {
				request.post(api('channels.invite'))
					.set(credentials)
					.send({
						roomId: readOnlyChannel.roomId,
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(() => {
						done();
					});
			});

			it('should fail to create a task when the user lacks permission', async (done) => {
				await updatePermission('post-readonly', ['bot']);
				request.post(api('taskRoom.createTask'))
					.set(userCredentials)
					.send({
						rid: readOnlyChannel.roomId,
						title: 'Test title',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});

			it('should create a task when the user has permission to send messages on readonly channels', async () => {
				await updatePermission('post-readonly', ['user']);

				await request.post(api('taskRoom.createTask'))
					.set(userCredentials)
					.send({
						rid: readOnlyChannel.roomId,
						title: 'Test Title',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('task').and.to.be.an('object');
						expect(res.body).to.have.nested.property('task.title', 'Test Title');
					});

				await updatePermission('post-readonly', ['admin', 'owner', 'moderator']);
			});
		});

		describe('Follow and unfollow task', () => {
			const task = {};
			task._id = `id-${ Date.now() }`;
			before((done) => {
				request.post(api('taskRoom.createTask'))
					.set(credentials)
					.send({
						_id: task._id,
						rid: 'GENERAL',
						title: 'Test title',
						taskDescription: 'Test Descr',
						taskAssignee: '@TestUser',
						taskStatus: 'Urgent',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});

			it('should follow a task', (done) => {
				request.post(api('taskRoom.followTask'))
					.set(credentials)
					.send({
						mid: task._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('task').and.to.be.an('object');
					})
					.end(done);
			});
			it('should unfollow a task', (done) => {
				request.post(api('taskRoom.unfollowTask'))
					.set(credentials)
					.send({
						task: {
							mid: task._id,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('task').and.to.be.an('object');
					})
					.end(done);
			});
		});
	});
});
