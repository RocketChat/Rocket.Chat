/* eslint-env mocha */
import supertest from 'supertest';
import {adminUsername, adminPassword} from '../../data/user.js';
export const rcrequest = supertest.agent('http://localhost:3000');


describe('[Custom Room Types]', function() {
	let userId;
	let authToken;
	let roomid;
	const DDP = require('ddp');
	const login = require('ddp-login');


	it('Login to Rocket.Chat api', function(done) {
		rcrequest.post('/api/v1/login')
			.set('Content-Type', 'application/json')
			.send({
				username: adminUsername,
				password: adminPassword
			})
			.end(function(err, res) {
				authToken = res.body.data.authToken;
				userId = res.body.data.userId;
				res.status.should.be.equal(200);
				process.env.METEOR_TOKEN = authToken;
				done();
			});
	});

	it('Create new room type', function(done) {
		const ddpClient = new DDP({
			host: 'localhost',
			port: 3000,
			maintainCollections: true
		});

		// console.log('created ddpClient');
		// console.log(process.env.METEOR_TOKEN);
		ddpClient.connect(function(error, wasReconnect) {
			// If autoReconnect is true, this callback will be invoked each time
			// a server connection is re-established
			if (error) {
				console.log('DDP connection error!');
				return;
			}

			if (wasReconnect) {
				console.log('Reestablishment of a connection.');
			}

			// console.log('connected!');
			login(ddpClient, {
				env: 'METEOR_TOKEN',
				method: 'token',
				retry: 5
			},

			function(error) {
				if (error) {
					throw new Error(`ERROR:  ${ error }`);
				} else {
					// console.log(userInfo);
					ddpClient.call(
						'createRoomType', // name of Meteor Method being called
						[25, 'question', ' ', 'testlabel', 'testname', '/testtype/:name'], // parameters to send to Meteor Method
						function(err, result) { // callback which returns the method call results
							if (typeof result !== 'undefined') {
								console.log('CreateRoomType, result: ');
								console.log(result);
							}
							if (typeof err !== 'undefined') {
								console.log('error happend: ');
								console.log(err);
							}
						},
						function() { // callback which fires when server has finished
							// console.log('CreateRoomType - Function was finished');  // sending any updated documents as a result of
						}
					);
				}
			});
		});
		setTimeout(function() { ddpClient.close(); done(); }, 1000);
	});

	it('CreateCustomRoom', function(done) {

		const ddpClient = new DDP({
			host: 'localhost',
			port: 3000,
			maintainCollections: true
		});

		// console.log('created ddpClient');
		// console.log(process.env.METEOR_TOKEN);
		ddpClient.connect(function(error, wasReconnect) {
			// If autoReconnect is true, this callback will be invoked each time
			// a server connection is re-established
			if (error) {
				console.log('DDP connection error!');
				return;
			}

			if (wasReconnect) {
				console.log('Reestablishment of a connection.');
			}

			// console.log('connected!');
			login(ddpClient, {
				env: 'METEOR_TOKEN',
				method: 'token',
				retry: 5
			},

			function(error) {
				if (error) {
					throw new Error(`ERROR:  ${ error }`);
				} else {
					// console.log(userInfo);
					ddpClient.call(
						'createCustomRoom', // name of Meteor Method being called
						['test', 'NewTestRoom', [adminUsername]], // parameters to send to Meteor Method
						function(err, result) { // callback which returns the method call results
							if (typeof result !== 'undefined') {
								console.log('CreateCustomRoom, result: ');
								console.log(result);
								roomid = result.rid;
							}
							if (typeof err !== 'undefined') {
								console.log('error happend: ');
								console.log(err);
							}
							// expect(err).to.be.equal(undefined);
							// expect(result).to.not.be.equal(false);
							// expect(err).to.be.equal(undefined);
						},
						function() { // callback which fires when server has finished
							// console.log('CreateCustomRoom - Function was finished');  // sending any updated documents as a result of
						}
					);
				}
			});
		});
		setTimeout(function() { ddpClient.close(); done(); }, 1000);
	});

	it('Get Available Rooms', function(done) {

		const ddpClient = new DDP({
			host: 'localhost',
			port: 3000,
			maintainCollections: true
		});

		// console.log('created ddpClient');
		// console.log(process.env.METEOR_TOKEN);
		ddpClient.connect(function(error, wasReconnect) {
			// If autoReconnect is true, this callback will be invoked each time
			// a server connection is re-established
			if (error) {
				console.log('DDP connection error!');
				return;
			}

			if (wasReconnect) {
				console.log('Reestablishment of a connection.');
			}

			// console.log('connected!');
			login(ddpClient, {
				env: 'METEOR_TOKEN',
				method: 'token',
				retry: 5
			},

			function(error) {
				if (error) {
					throw new Error(`ERROR:  ${ error }`);
				} else {
					// console.log(userInfo);
					ddpClient.call(
						'rooms/get', // name of Meteor Method being called
						[{ '$date': 0 }], // parameters to send to Meteor Method
						function(err, result) { // callback which returns the method call results
							// console.log('GetRooms, result: ' + result);
							for (const i in result) {
								// console.log(result[i]);
								if (result[i].t === 'test' && result[i].name === 'NewTestRoom') {
									console.log('found test room');
									result[i]._id.should.be.equal(roomid);
								}
							}
							if (typeof err !== 'undefined') {
								console.log('error happend: ');
								console.log(err);
							}
							roomid.should.not.equal(undefined);
						},
						function() { // callback which fires when server has finished
							// console.log('GetRooms - Function was finished');  // sending any updated documents as a result of
						}
					);
				}
			});
		});
		setTimeout(function() { ddpClient.close(); done(); }, 1000);
	});

	it('Remove custom Room', function(done) {

		const ddpClient = new DDP({
			host: 'localhost',
			port: 3000,
			maintainCollections: true
		});

		// console.log('created ddpClient');
		// console.log(process.env.METEOR_TOKEN);
		ddpClient.connect(function(error, wasReconnect) {
			// If autoReconnect is true, this callback will be invoked each time
			// a server connection is re-established
			if (error) {
				console.log('DDP connection error!');
				return;
			}

			if (wasReconnect) {
				console.log('Reestablishment of a connection.');
			}

			// console.log('connected!');
			login(ddpClient, {
				env: 'METEOR_TOKEN',
				method: 'token',
				retry: 5
			},

			function(error) {
				if (error) {
					throw new Error(`ERROR:  ${ error }`);
				} else {
					// console.log(userInfo);
					ddpClient.call(
						'eraseRoom', // name of Meteor Method being called
						[roomid], // parameters to send to Meteor Method
						function(err, result) { // callback which returns the method call results
							// console.log('EraseRoom, result: ');
							if (typeof result !== 'undefined') {
								result.should.be.equal(1);
								// console.log(result);
							}
							if (typeof err !== 'undefined') {
								console.log('error happend: ');
								console.log(err);
							}
						},
						function() { // callback which fires when server has finished
							// console.log('GetRooms - Function was finished');  // sending any updated documents as a result of
						}
					);
				}
			});
		});
		setTimeout(function() { ddpClient.close(); done(); }, 1000);
	});

	it('Room should not exist anymore', function(done) {

		const ddpClient = new DDP({
			host: 'localhost',
			port: 3000,
			maintainCollections: true
		});

		// console.log('created ddpClient');
		// console.log(process.env.METEOR_TOKEN);
		ddpClient.connect(function(error, wasReconnect) {
			// If autoReconnect is true, this callback will be invoked each time
			// a server connection is re-established
			if (error) {
				console.log('DDP connection error!');
				return;
			}

			if (wasReconnect) {
				console.log('Reestablishment of a connection.');
			}

			// console.log('connected!');
			login(ddpClient, {
				env: 'METEOR_TOKEN',
				method: 'token',
				retry: 5
			},

			function(error) {
				if (error) {
					throw new Error(`ERROR:  ${ error }`);
				} else {
					// console.log(userInfo);
					ddpClient.call(
						'rooms/get', // name of Meteor Method being called
						[{ '$date': 0 }], // parameters to send to Meteor Method
						function(err, result) { // callback which returns the method call results
							// console.log('GetRooms, result: ' + result);
							for (const i in result) {
								// console.log(result[i]);
								if (result[i].t === 'test' && result[i].name === 'NewTestRoom') {
									console.log('found test room');
									result[i]._id.should.be.equal(roomid);
								} else if (result[i].t !== 'd') {
									result[i].t.should.not.equal('test');
									result[i].name.should.not.equal('NewTestRoom');
								}

							}
							if (typeof err !== 'undefined') {
								console.log('error happend: ');
								console.log(err);
							}
							roomid.should.not.equal(undefined);
						},
						function() { // callback which fires when server has finished
							// console.log('GetRooms - Function was finished');  // sending any updated documents as a result of
						}
					);
				}
			});
		});
		setTimeout(function() { ddpClient.close(); done(); }, 1000);
	});

	it('Logout from Rocketchat api', function(done) {
		rcrequest.get('/api/v1/logout')
			.set('X-Auth-Token', authToken)
			.set('X-User-Id', userId)
			.expect(200)
			.end(done);
	});
});
