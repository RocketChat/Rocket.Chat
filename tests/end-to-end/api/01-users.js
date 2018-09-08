/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import crypto from 'crypto';
import {
	getCredentials,
	api,
	login,
	request,
	credentials,
	apiEmail,
	apiUsername,
	targetUser,
	log,
} from '../../data/api-data.js';
import { adminEmail, preferences, password } from '../../data/user.js';
import { imgURL } from '../../data/interactions.js';
import { customFieldText, clearCustomFields, setCustomFields } from '../../data/custom-fields.js';

describe('[Users]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/users.create]', () => {
		before((done) => clearCustomFields(done));
		after((done) => clearCustomFields(done));

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
					verified: true,
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
			setCustomFields({ customFieldText }, (error) => {
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
						customFields,
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
							customFields,
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
			{ name: 'customFieldText', value: '', reason: 'is required and missing' },
			{ name: 'customFieldText', value: '0', reason: 'length is less than minLength' },
			{ name: 'customFieldText', value: '0123456789-0', reason: 'length is more than maxLength' },
		].forEach((field) => {
			failUserWithCustomField(field);
		});
	});

	describe('[/users.info]', () => {
		it('should query information about a user by userId', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id,
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
					userId: targetUser._id,
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
			// filtering user list
			request.get(api('users.list'))
				.set(credentials)
				.query({
					name: { $regex: 'g' },
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
		const updateSetting = (setting, value) => new Promise((resolve) => {
			request.post(`/api/v1/settings/${ setting }`)
				.set(credentials)
				.send({ value })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(resolve);
		});
		before((done) => {
			updateSetting('Accounts_AllowUserProfileChange', true)
				.then(() => updateSetting('Accounts_AllowUsernameChange', true))
				.then(() => updateSetting('Accounts_AllowRealNameChange', true))
				.then(() => updateSetting('Accounts_AllowEmailChange', true))
				.then(() => updateSetting('Accounts_AllowPasswordChange', true))
				.then(done);
		});
		after((done) => {
			updateSetting('Accounts_AllowUserProfileChange', true)
				.then(() => updateSetting('Accounts_AllowUsernameChange', true))
				.then(() => updateSetting('Accounts_AllowRealNameChange', true))
				.then(() => updateSetting('Accounts_AllowEmailChange', true))
				.then(() => updateSetting('Accounts_AllowPasswordChange', true))
				.then(done);
		});

		it('should update a user\'s info by userId', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						email: apiEmail,
						name: `edited${ apiUsername }`,
						username: `edited${ apiUsername }`,
						password,
						active: true,
						roles: ['user'],
					},
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

		it('should update a user\'s email by userId', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						email: `edited${ apiEmail }`,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.emails[0].address', `edited${ apiEmail }`);
					expect(res.body).to.have.nested.property('user.emails[0].verified', false);
				})
				.end(done);
		});

		it('should verify user\'s email by userId', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUser._id,
					data: {
						verified: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.emails[0].verified', true);
				})
				.end(done);
		});

		it('should return an error when trying update username and it is not allowed', (done) => {
			updateSetting('Accounts_AllowUsernameChange', false)
				.then(() => {
					request.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								username: 'fake.name',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
		});

		it('should return an error when trying update user real name and it is not allowed', (done) => {
			updateSetting('Accounts_AllowRealNameChange', false)
				.then(() => {
					request.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								name: 'Fake name',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
		});

		it('should return an error when trying update user email and it is not allowed', (done) => {
			updateSetting('Accounts_AllowEmailChange', false)
				.then(() => {
					request.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								email: 'itsnotworking@email.com',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
		});

		it('should return an error when trying update user password and it is not allowed', (done) => {
			updateSetting('Accounts_AllowPasswordChange', false)
				.then(() => {
					request.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								password: 'itsnotworking',
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
		});

		it('should return an error when trying update profile and it is not allowed', (done) => {
			updateSetting('Accounts_AllowUserProfileChange', false)
				.then(() => {
					request.post(api('users.update'))
						.set(credentials)
						.send({
							userId: targetUser._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
		});
	});

	describe('[/users.updateOwnBasicInfo]', () => {
		let user;
		before((done) => {
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
		before((done) => {
			request.post(api('login'))
				.send({
					user: user.username,
					password,
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
		after((done) => {
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(done);
			user = undefined;
		});

		const newPassword = `${ password }test`;
		const editedUsername = `basicInfo.name${ +new Date() }`;
		const editedName = `basic-info-test-name${ +new Date() }`;
		const editedEmail = `test${ +new Date() }@mail.com`;

		it('should update the user own basic information', (done) => {
			request.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						name: editedName,
						username: editedUsername,
						currentPassword: crypto.createHash('sha256').update(password, 'utf8').digest('hex'),
						newPassword,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { user } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(user.username).to.be.equal(editedUsername);
					expect(user.name).to.be.equal(editedName);
				})
				.end(done);
		});

		it('should update the user name only', (done) => {
			request.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						username: editedUsername,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { user } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(user.username).to.be.equal(editedUsername);
				})
				.end(done);
		});

		it('should throw an error when user try change email without the password', (done) => {
			request.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						email: editedEmail,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});

		it('should throw an error when user try change password without the actual password', (done) => {
			request.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						newPassword: 'the new pass',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.end(done);
		});

		it('should throw an error when the name is only whitespaces', (done) => {
			request.post(api('users.updateOwnBasicInfo'))
				.set(credentials)
				.send({
					data: {
						name: '  ',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should set new email as \'unverified\'', (done) => {
			request.post(api('users.updateOwnBasicInfo'))
				.set(userCredentials)
				.send({
					data: {
						email: editedEmail,
						currentPassword: crypto.createHash('sha256').update(newPassword, 'utf8').digest('hex'),
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { user } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(user.emails[0].address).to.be.equal(editedEmail);
					expect(user.emails[0].verified).to.be.false;
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
					password,
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
		afterEach((done) => {
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(done);
			user = undefined;
		});

		describe('logged as admin:', () => {
			it('should return the user id and a new token', (done) => {
				request.post(api('users.createToken'))
					.set(credentials)
					.send({
						username: user.username,
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
						username: user.username,
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
						username: 'rocket.cat',
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
						username: user.username,
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
			it('should return 200', (done) => request.post(api('users.createToken'))
				.set(credentials)
				.send({ username: user.username })
				.expect('Content-Type', 'application/json')
				.end((err, res) => (err ? done() :
					request.get(api('me'))
						.set({ 'X-Auth-Token': `${ res.body.data.authToken }`, 'X-User-Id': res.body.data.userId })
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done))
				)
			);
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
					expect(res.body.preferences).to.be.eql(preferences.data);
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/users.forgotPassword]', () => {
		it('should send email to user (return success), when is a valid email', (done) => {
			request.post(api('users.forgotPassword'))
				.send({
					email: adminEmail,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should not send email to user(return error), when is a invalid email', (done) => {
			request.post(api('users.forgotPassword'))
				.send({
					email: 'invalidEmail',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('[/users.getUsernameSuggestion]', () => {
		const testUsername = `test${ +new Date() }`;
		let targetUser;
		let userCredentials;
		it('register a new user...', (done) => {
			request.post(api('users.register'))
				.set(credentials)
				.send({
					email: `${ testUsername }.@teste.com`,
					username: `${ testUsername }test`,
					name: testUsername,
					pass: password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					targetUser = res.body.user;
				})
				.end(done);
		});
		it('Login...', (done) => {
			request.post(api('login'))
				.send({
					user: targetUser.username,
					password,
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

		it('should return an username suggestion', (done) => {
			request.get(api('users.getUsernameSuggestion'))
				.set(userCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.result).to.be.equal(testUsername);
				})
				.end(done);
		});

	});

	describe('[/users.deleteOwnAccount]', () => {
		const testUsername = `testuser${ +new Date() }`;
		let targetUser;
		let userCredentials;
		it('register a new user...', (done) => {
			request.post(api('users.register'))
				.set(credentials)
				.send({
					email: `${ testUsername }.@teste.com`,
					username: `${ testUsername }test`,
					name: testUsername,
					pass: password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					targetUser = res.body.user;
				})
				.end(done);
		});
		it('Login...', (done) => {
			request.post(api('login'))
				.send({
					user: targetUser.username,
					password,
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

		it('Enable "Accounts_AllowDeleteOwnAccount" setting...', (done) => {
			request.post('/api/v1/settings/Accounts_AllowDeleteOwnAccount')
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should delete user own account', (done) => {
			request.post(api('users.deleteOwnAccount'))
				.set(userCredentials)
				.send({
					password: crypto.createHash('sha256').update(password, 'utf8').digest('hex'),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

	});

	describe('[/users.delete]', () => {
		const updatePermission = (permission, roles) => new Promise((resolve) => {
			request.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions: [{ _id: permission, roles }] })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(resolve);
		});
		const testUsername = `testuser${ +new Date() }`;
		let targetUser;
		it('register a new user...', (done) => {
			request.post(api('users.register'))
				.set(credentials)
				.send({
					email: `${ testUsername }.@teste.com`,
					username: `${ testUsername }test`,
					name: testUsername,
					pass: password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					targetUser = res.body.user;
				})
				.end(done);
		});
		it('should return an error when trying delete user account without "delete-user" permission', (done) => {
			updatePermission('delete-user', ['user'])
				.then(() => {
					request.post(api('users.delete'))
						.set(credentials)
						.send({
							userId: targetUser._id,
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
		it('should delete user account when logged user has "delete-user" permission', (done) => {
			updatePermission('delete-user', ['admin'])
				.then(() => {
					request.post(api('users.delete'))
						.set(credentials)
						.send({
							userId: targetUser._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
		});
	});

	describe('Personal Access Tokens', () => {
		const tokenName = `${ Date.now() }token`;
		describe('successful cases', () => {
			it('Enable "API_Enable_Personal_Access_Tokens" setting...', (done) => {
				request.post('/api/v1/settings/API_Enable_Personal_Access_Tokens')
					.set(credentials)
					.send({ value: true })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			describe('[/users.generatePersonalAccessToken]', () => {
				it('should return a personal access token to user', (done) => {
					request.post(api('users.generatePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('token');
						})
						.end(done);
				});
				it('should throw an error when user tries generate a token with the same name', (done) => {
					request.post(api('users.generatePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
			describe('[/users.regeneratePersonalAccessToken]', () => {
				it('should return a personal access token to user when user regenerates the token', (done) => {
					request.post(api('users.regeneratePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('token');
						})
						.end(done);
				});
				it('should throw an error when user tries regenerate a token that does not exist', (done) => {
					request.post(api('users.regeneratePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName: 'tokenthatdoesnotexist',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
			describe('[/users.getPersonalAccessTokens]', () => {
				it('should return my personal access tokens', (done) => {
					request.get(api('users.getPersonalAccessTokens'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('tokens').and.to.be.an('array');
						})
						.end(done);
				});
			});
			describe('[/users.removePersonalAccessToken]', () => {
				it('should return success when user remove a personal access token', (done) => {
					request.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
						})
						.end(done);
				});
				it('should throw an error when user tries remove a token that does not exist', (done) => {
					request.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName: 'tokenthatdoesnotexist',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
						})
						.end(done);
				});
			});
		});
		describe('unsuccessful cases', () => {
			it('disable "API_Enable_Personal_Access_Tokens" setting...', (done) => {
				request.post('/api/v1/settings/API_Enable_Personal_Access_Tokens')
					.set(credentials)
					.send({ value: false })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
			describe('should return an error when setting "API_Enable_Personal_Access_Tokens" is disabled for the following routes', () => {
				it('/users.generatePersonalAccessToken', (done) => {
					request.post(api('users.generatePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('error-personal-access-tokens-are-current-disabled');
						})
						.end(done);
				});
				it('/users.regeneratePersonalAccessToken', (done) => {
					request.post(api('users.regeneratePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('error-personal-access-tokens-are-current-disabled');
						})
						.end(done);
				});
				it('/users.getPersonalAccessTokens', (done) => {
					request.get(api('users.getPersonalAccessTokens'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('error-personal-access-tokens-are-current-disabled');
						})
						.end(done);
				});
				it('/users.removePersonalAccessToken', (done) => {
					request.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('error-personal-access-tokens-are-current-disabled');
						})
						.end(done);
				});
				it('should throw an error when user tries remove a token that does not exist', (done) => {
					request.post(api('users.removePersonalAccessToken'))
						.set(credentials)
						.send({
							tokenName: 'tokenthatdoesnotexist',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('error-personal-access-tokens-are-current-disabled');
						})
						.end(done);
				});
			});
		});
	});
});
