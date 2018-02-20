/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {getCredentials, api, login, request, credentials, apiEmail, apiUsername, targetUser, log} from '../../data/api-data.js';
import {adminEmail, password, preferences} from '../../data/user.js';
import {imgURL} from '../../data/interactions.js';
import {customFieldText, clearCustomFields, setCustomFields} from '../../data/custom-fields.js';

describe('[Users]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('[/users.create]', () => {
		before(done => clearCustomFields(done));
		after(done => clearCustomFields(done));

		it('should create a new user', (done) => {
			request.post(api('users.create'))
				.set(credentials)
				.send({
					email: apiEmail,
					name: apiUsername,
					username: apiUsername,
					password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified: true
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', apiUsername);
					expect(res.body).to.have.nested.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', apiUsername);

					expect(res.body).to.not.have.nested.property('user.customFields');

					targetUser._id = res.body.user._id;
				})
				.end(done);
		});

		it('should create a new user with custom fields', (done) => {
			setCustomFields({customFieldText}, (error) => {
				if (error) {
					return done(error);
				}

				const username = `customField_${ apiUsername }`;
				const email = `customField_${ apiEmail }`;
				const customFields = { customFieldText: 'success' };

				request.post(api('users.create'))
					.set(credentials)
					.send({
						email,
						name: username,
						username,
						password,
						active: true,
						roles: ['user'],
						joinDefaultChannels: true,
						verified: true,
						customFields
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.username', username);
						expect(res.body).to.have.nested.property('user.emails[0].address', email);
						expect(res.body).to.have.nested.property('user.active', true);
						expect(res.body).to.have.nested.property('user.name', username);
						expect(res.body).to.have.nested.property('user.customFields.customFieldText', 'success');
					})
					.end(done);
			});
		});

		function failUserWithCustomField(field) {
			it(`should not create a user if a custom field ${ field.reason }`, (done) => {
				setCustomFields({ customFieldText }, (error) => {
					if (error) {
						return done(error);
					}

					const customFields = {};
					customFields[field.name] = field.value;

					request.post(api('users.create'))
						.set(credentials)
						.send({
							email: `customField_fail_${ apiEmail }`,
							name: `customField_fail_${ apiUsername }`,
							username: `customField_fail_${ apiUsername }`,
							password,
							active: true,
							roles: ['user'],
							joinDefaultChannels: true,
							verified: true,
							customFields
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('errorType', 'error-user-registration-custom-field');
						})
						.end(done);
				});
			});
		}

		[
			{name: 'customFieldText', value: '', reason: 'is required and missing'},
			{name: 'customFieldText', value: '0', reason: 'length is less than minLength'},
			{name: 'customFieldText', value: '0123456789-0', reason: 'length is more than maxLength'}
		].forEach((field) => { failUserWithCustomField(field); });
	});

	describe('[/users.info]', () => {
		it('should query information about a user by userId', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', apiUsername);
					expect(res.body).to.have.nested.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', apiUsername);
				})
				.end(done);
		});
	});

	describe('[/users.getPresence]', () => {
		it('should query a user\'s presence by userId', (done) => {
			request.get(api('users.getPresence'))
				.set(credentials)
				.query({
					userId: targetUser._id
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('presence', 'offline');
				})
				.end(done);
		});
	});

	describe('[/users.list]', () => {
		it('should query all users in the system', (done) => {
			request.get(api('users.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it.skip('should query all users in the system by name', (done) => {
			//filtering user list
			request.get(api('users.list'))
				.set(credentials)
				.query({
					name: { '$regex': 'g' }
				})
				.field('username', 1)
				.sort('createdAt', -1)
				.expect(log)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});
	});

	describe('[/users.setAvatar]', () => {
		it.skip('should set the avatar of the auth user', (done) => {
			request.post(api('users.setAvatar'))
				.set(credentials)
				.attach('avatarUrl', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/users.update]', () => {
		it('should update a user\'s info by userId', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data :{
						email: apiEmail,
						name: `edited${ apiUsername }`,
						username: `edited${ apiUsername }`,
						password,
						active: true,
						roles: ['user']
					}
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', `edited${ apiUsername }`);
					expect(res.body).to.have.nested.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', `edited${ apiUsername }`);
				})
				.end(done);
		});
	});

	describe('[/users.createToken]', () => {
		let user;
		beforeEach((done) => {
			const username = `user.test.${ Date.now() }`;
			const email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});

		let userCredentials;
		beforeEach((done) => {
			request.post(api('login'))
				.send({
					user: user.username,
					password
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					userCredentials = {};
					userCredentials['X-Auth-Token'] = res.body.data.authToken;
					userCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
		afterEach(done => {
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id
			}).end(done);
			user = undefined;
		});

		describe('logged as admin:', () => {
			it('should return the user id and a new token', (done) => {
				request.post(api('users.createToken'))
					.set(credentials)
					.send({
						username: user.username
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('data.userId', user._id);
						expect(res.body).to.have.nested.property('data.authToken');
					})
					.end(done);
			});
		});

		describe('logged as itself:', () => {
			it('should return the user id and a new token', (done) => {
				request.post(api('users.createToken'))
					.set(userCredentials)
					.send({
						username: user.username
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('data.userId', user._id);
						expect(res.body).to.have.nested.property('data.authToken');
					})
					.end(done);
			});
		});

		describe('As an user not allowed:', () => {
			it('should return 401 unauthorized', (done) => {
				request.post(api('users.createToken'))
					.set(userCredentials)
					.send({
						username: 'rocket.cat'
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('errorType');
						expect(res.body).to.have.property('error');
					})
					.end(done);
			});
		});

		describe('Not logged in:', () => {
			it('should return 401 unauthorized', (done) => {
				request.post(api('users.createToken'))
					.send({
						username: user.username
					})
					.expect('Content-Type', 'application/json')
					.expect(401)
					.expect((res) => {
						expect(res.body).to.have.property('message');
					})
					.end(done);
			});
		});

		describe('Testing if the returned token is valid:', (done) => {
			it('should return 200', (done) => {
				return request.post(api('users.createToken'))
					.set(credentials)
					.send({ username: user.username })
					.expect('Content-Type', 'application/json')
					.end((err, res) => {
						return err ? done () : request.get(api('me'))
							.set({ 'X-Auth-Token': `${ res.body.data.authToken }`, 'X-User-Id': res.body.data.userId })
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
			});
		});
	});

	describe('[/user.roles]', () => {

		it('should return id and name of user, and an array of roles', (done) => {
			request.get(api('user.roles'))
				.set(credentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('username');
					expect(res.body).to.have.property('roles').and.to.be.a('array');
					expect(res.body).to.have.property('_id');
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/users.setPreferences]', () => {
		it('should set some preferences by user when execute successfully', (done) => {
			preferences.userId = credentials['X-User-Id'];
			request.post(api('users.setPreferences'))
				.set(credentials)
				.send(preferences)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body.user.settings.preferences).to.be.eql(preferences.data);
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/users.getPreferences]', () => {
		it('should return all preferences when execute successfully', (done) => {
			request.get(api('users.getPreferences'))
				.set(credentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});
});
