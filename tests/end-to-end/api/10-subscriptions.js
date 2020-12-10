import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { createRoom } from '../../data/rooms.helper';
import { createUser } from '../../data/users.helper';

describe('[Subscriptions]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	it('/subscriptions.get', (done) => {
		request.get(api('subscriptions.get'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('update');
				expect(res.body).to.have.property('remove');
			})
			.end(done);
	});

	it('/subscriptions.get?updatedSince', (done) => {
		request.get(api('subscriptions.get'))
			.set(credentials)
			.query({
				updatedSince: new Date(),
			})
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('update').that.have.lengthOf(0);
				expect(res.body).to.have.property('remove').that.have.lengthOf(0);
			})
			.end(done);
	});

	it('/subscriptions.getOne:', () => {
		let testChannel;
		it('create an channel', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${ Date.now() }`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('subscriptions.getOne', (done) => {
			request.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('subscription').and.to.be.an('object');
				})
				.end(done);
		});
	});

	describe('update group dms name', () => {
		before(async () => {
			const testUser = await createUser();
			const admin = 'rocketchat.internal.admin.test';
			const rocketcat = 'rocket.cat';

			console.log('test user: ', testUser.username);
			const usernames = [testUser.username, admin, rocketcat].join(',');

			request.post(api('dm.create'))
				.set(credentials)
				.send({
					usernames,
				})
				.end((err, res) => {
					this.roomId = res.body.room.rid;
					this.testUser = testUser;
				});
		});

		it('should update group name', (done) => {
			setTimeout(() => {
				request.post(api('users.update'))
					.set(credentials)
					.send({
						userId: this.testUser._id,
						data: {
							username: `changed.${ this.testUser.username }`,
						},
					})
					.end(() => {
					  request.get(api('rooms.info'))
					  .set(credentials)
					  .query({ roomId: this.roomId })
					  .end((err, res) => {
					  	const { room } = res.body;
					  	expect(room.usernames.includes(`changed.${ this.testUser.username }`)).to.be.true;
					  	done();
				  	});
				  });
			}, 200);
		});
	});

	describe('[/subscriptions.read]', () => {
		let testChannel;
		it('create a channel', (done) => {
			createRoom({ type: 'c', name: `channel.test.${ Date.now() }` })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});

		let testGroup;
		it('create a group', (done) => {
			createRoom({ type: 'p', name: `channel.test.${ Date.now() }` })
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});

		let testDM;
		it('create a DM', (done) => {
			createRoom({ type: 'd', username: 'rocket.cat' })
				.end((err, res) => {
					testDM = res.body.room;
					done();
				});
		});

		it('should mark public channels as read', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should mark groups as read', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: testGroup._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should mark DMs as read', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: testDM._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should fail on mark inexistent public channel as read', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: 'foobar123-somechannel',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should fail on mark inexistent group as read', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: 'foobar123-somegroup',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should fail on mark inexistent DM as read', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: 'foobar123-somedm',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should fail on invalid params', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({
					rid: 12345,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should fail on empty params', (done) => {
			request.post(api('subscriptions.read'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});

	describe('[/subscriptions.unread]', () => {
		let testChannel;
		it('create an channel', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${ Date.now() }`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('sending message', (done) => {
			request.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: testChannel._id,
						msg: 'Sample message',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
				})
				.end(done);
		});
		it('should return success: true when make as unread successfully', (done) => {
			request.post(api('subscriptions.unread'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should fail on invalid params', (done) => {
			request.post(api('subscriptions.unread'))
				.set(credentials)
				.send({
					roomId: 12345,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should fail on empty params', (done) => {
			request.post(api('subscriptions.unread'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});
});
