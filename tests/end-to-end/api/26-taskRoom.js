import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper.js';
import { password } from '../../data/user';

describe('[TaskRoom]', () => {
	before((done) => getCredentials(done));

	const community = `community${ Date.now() }`;
	let roomTest;
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
					roomTest = res.body.taskRoom;
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
		it('should create a task when the user is the owner of a readonly channel', async () => {
			await updatePermission('post-readonly', ['owner, user']);
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
				});
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

		it('should fail to create a task when the user lacks permission', async () => {
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
				});
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

	describe('/taskRoom.follow and /taskRoom.unfollow', () => {
		const task = {};
		let channel;
		before((done) => {
			request.post(api('taskRoom.create'))
				.set(credentials)
				.send({
					name: `readonlychannel${ +new Date() }`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					channel = res.body.taskRoom;
				})
				.end(done);
		});
		before((done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: channel.roomId,
					title: 'Test title',
					taskDescription: 'Test Descr',
					taskAssignee: '@TestUser',
					taskStatus: 'Urgent',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					task._id = res.body.task._id;
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
				})
				.end(done);
		});
		it('should unfollow a task', (done) => {
			request.post(api('taskRoom.unfollowTask'))
				.set(credentials)
				.send({
					mid: task._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/taskRoom.taskUpdate', () => {
		const task = {};

		before((done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: roomTest.roomId,
					title: 'Test title',
					taskDescription: 'Test Descr',
					taskAssignee: '@TestUser',
					taskStatus: 'Urgent',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					task._id = res.body.task._id;
				})
				.end(done);
		});

		it('Update the title, description, assignee, status of the task', (done) => {
			request.post(api('taskRoom.taskUpdate'))
				.set(credentials)
				.send({
					id: task._id,
					taskTitle: 'New Title',
					taskDescription: 'New Descr',
					taskAssignee: '@TestUser2',
					taskStatus: 'Not Urgent',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('task').and.to.be.an('object');
					expect(res.body).to.have.nested.property('task.title', 'New Title');
					expect(res.body).to.have.nested.property('task.taskDescription', 'New Descr');
					expect(res.body).to.have.nested.property('task.taskAssignee', '@TestUser2');
					expect(res.body).to.have.nested.property('task.taskStatus', 'Not Urgent');
				})
				.end(done);
		});

		it('This should fail if the user does not have the right permissions', async () => {
			await updatePermission('edit-task', ['']);
			request.post(api('taskRoom.taskUpdate'))
				.set(credentials)
				.send({
					id: task._id,
					taskTitle: 'Title',
					taskDescription: 'New Descr',
					taskAssignee: '@TestUser2',
					taskStatus: 'Not Urgent',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				});
			await updatePermission('edit-task', ['admin', 'moderator', 'owner']);
		});
	});

	describe('/taskRoom.taskHistory', () => {
		before((done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: roomTest.roomId,
					title: 'New Task',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('Should return an array with 2 tasks', (done) => {
			request.get(api('taskRoom.taskHistory'))
				.set(credentials)
				.query({
					rid: roomTest.roomId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.be.an('array');
					expect(res.body[0]).to.have.property('title', 'New Title');
					expect(res.body[0]).to.have.property('rid', roomTest.roomId);
					expect(res.body[1]).to.have.property('title', 'New Task');
					expect(res.body[1]).to.have.property('rid', roomTest.roomId);
				})
				.end(done);
		});
	});

	describe('/taskRoom.deleteTask', () => {
		const task = {};
		before((done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: roomTest.roomId,
					title: 'New Task to delete',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					task._id = res.body.task._id;
				})
				.end(done);
		});
		it('Should delete the task', (done) => {
			request.post(api('taskRoom.deleteTask'))
				.set(credentials)
				.send({
					taskId: task._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('Should not find the task', (done) => {
			request.get(api('taskRoom.taskDetails'))
				.set(credentials)
				.query({
					taskId: task._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('Task not found');
				})
				.end(done);
		});
	});
	describe('/taskRoom.taskDetails', () => {
		const task = {};
		before((done) => {
			request.post(api('taskRoom.createTask'))
				.set(credentials)
				.send({
					rid: roomTest.roomId,
					title: 'New Task to find',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					task._id = res.body.task._id;
				})
				.end(done);
		});
		it('Should revieve the task details', (done) => {
			request.get(api('taskRoom.taskDetails'))
				.set(credentials)
				.query({
					taskId: task._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('title', 'New Task to find');
					expect(res.body).to.have.property('rid', roomTest.roomId);
				})
				.end(done);
		});
		it('Should return an error if there is no taskId', (done) => {
			request.get(api('taskRoom.taskDetails'))
				.set(credentials)
				.query()
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.be.equal('Missing id for the task');
				})
				.end(done);
		});
	});
});
