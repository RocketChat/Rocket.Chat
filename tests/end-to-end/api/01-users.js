import crypto from 'crypto';

import { expect } from 'chai';

import {
	getCredentials,
	api,
	request,
	credentials,
	apiEmail,
	apiUsername,
	targetUser,
	log,
	wait,
} from '../../data/api-data.js';
import { adminEmail, preferences, password, adminUsername } from '../../data/user.js';
import { imgURL } from '../../data/interactions.js';
import { customFieldText, clearCustomFields, setCustomFields } from '../../data/custom-fields.js';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createUser, login, deleteUser, getUserStatus } from '../../data/users.helper.js';

describe('[Users]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	it('enabling E2E in server and generating keys to user...', (done) => {
		updateSetting('E2E_Enable', true).then(() => {
			request.post(api('e2e.setUserPublicAndPrivateKeys'))
				.set(credentials)
				.send({
					private_key: 'test',
					public_key: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

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
					expect(res.body).to.not.have.nested.property('user.e2e');

					expect(res.body).to.not.have.nested.property('user.customFields');

					targetUser._id = res.body.user._id;
					targetUser.username = res.body.user.username;
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
						expect(res.body).to.not.have.nested.property('user.e2e');
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

	describe('[/users.register]', () => {
		const email = `email@email${ Date.now() }.com`;
		const username = `myusername${ Date.now() }`;
		it('should register new user', (done) => {
			request.post(api('users.register'))
				.send({
					email,
					name: 'name',
					username,
					pass: 'test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.username', username);
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', 'name');
				})
				.end(done);
		});
		it('should return an error when trying register new user with an existing username', (done) => {
			request.post(api('users.register'))
				.send({
					email,
					name: 'name',
					username,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.equal('Username is already in use');
				})
				.end(done);
		});
	});

	describe('[/users.info]', () => {
		after(() => {
			updatePermission('view-other-user-channels', ['admin']);
			updatePermission('view-full-other-user-info', ['admin']);
		});

		it('should return an error when the user does not exist', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					username: 'invalid-username',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.equal('User not found.');
				})
				.end(done);
		});
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
					expect(res.body).to.have.nested.property('user.active', true);
					expect(res.body).to.have.nested.property('user.name', apiUsername);
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});
		it('should return "rooms" property when user request it and the user has the necessary permission (admin, "view-other-user-channels")', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id,
					fields: JSON.stringify({ userRooms: 1 }),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.rooms').and.to.be.an('array');
				})
				.end(done);
		});
		it('should NOT return "rooms" property when user NOT request it but the user has the necessary permission (admin, "view-other-user-channels")', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.not.have.nested.property('user.rooms');
				})
				.end(done);
		});
		it('should return the rooms when the user request your own rooms but he does NOT have the necessary permission', (done) => {
			updatePermission('view-other-user-channels', []).then(() => {
				request.get(api('users.info'))
					.set(credentials)
					.query({
						userId: credentials['X-User-Id'],
						fields: JSON.stringify({ userRooms: 1 }),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.rooms');
					})
					.end(done);
			});
		});
		it('should NOT return the rooms when the user request another user\'s rooms and he does NOT have the necessary permission', (done) => {
			updatePermission('view-other-user-channels', []).then(() => {
				request.get(api('users.info'))
					.set(credentials)
					.query({
						userId: targetUser._id,
						fields: JSON.stringify({ userRooms: 1 }),
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.nested.property('user.rooms');
					})
					.end(done);
			});
		});
		it('should NOT return some services fields when request to another user\'s info even if the user has the necessary permission', (done) => {
			updatePermission('view-full-other-user-info', ['admin']).then(() => {
				request.get(api('users.info'))
					.set(credentials)
					.query({
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.not.have.nested.property('user.services.emailCode');
						expect(res.body).to.not.have.nested.property('user.services.cloud');
						expect(res.body).to.not.have.nested.property('user.services.email2fa');
						expect(res.body).to.not.have.nested.property('user.services.totp');
						expect(res.body).to.not.have.nested.property('user.services.password');
						expect(res.body).to.not.have.nested.property('user.services.email');
						expect(res.body).to.not.have.nested.property('user.services.resume');
					})
					.end(done);
			});
		});
		it('should return all services fields when request for myself data even without privileged permission', (done) => {
			updatePermission('view-full-other-user-info', []).then(() => {
				request.get(api('users.info'))
					.set(credentials)
					.query({
						userId: credentials['X-User-Id'],
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('user.services.password');
						expect(res.body).to.have.nested.property('user.services.resume');
					})
					.end(done);
			});
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

	describe('[/users.presence]', () => {
		describe('Not logged in:', () => {
			it('should return 401 unauthorized', (done) => {
				request.get(api('users.presence'))
					.expect('Content-Type', 'application/json')
					.expect(401)
					.expect((res) => {
						expect(res.body).to.have.property('message');
					})
					.end(done);
			});
		});
		describe('Logged in:', () => {
			it('should return online users full list', (done) => {
				request.get(api('users.presence'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('full', true);
						expect(res.body).to.have.property('users').to.have.property('0').to.deep.have.all.keys(
							'_id',
							'avatarETag',
							'username',
							'name',
							'status',
							'utcOffset',
						);
					})
					.end(done);
			});

			it('should return no online users updated after now', (done) => {
				request.get(api(`users.presence?from=${ new Date().toISOString() }`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('full', false);
						expect(res.body).to.have.property('users').that.is.an('array').that.has.lengthOf(0);
					})
					.end(done);
			});

			it('should return full list of online users for more than 10 minutes in the past', (done) => {
				const date = new Date();
				date.setMinutes(date.getMinutes() - 11);

				request.get(api(`users.presence?from=${ date.toISOString() }`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('full', true);
						expect(res.body).to.have.property('users').to.have.property('0').to.deep.have.all.keys(
							'_id',
							'avatarETag',
							'username',
							'name',
							'status',
							'utcOffset',
						);
					})
					.end(done);
			});
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
					const myself = res.body.users.find((user) => user.username === adminUsername);
					expect(myself).to.not.have.property('e2e');
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
		let user;
		before(async () => {
			user = await createUser();
		});

		let userCredentials;
		before(async () => {
			userCredentials = await login(user.username, password);
		});
		before((done) => {
			updatePermission('edit-other-user-info', ['admin', 'user']).then(done);
		});
		after(async () => {
			await deleteUser(user);
			user = undefined;
			await updatePermission('edit-other-user-info', ['admin']);
		});
		it('should set the avatar of the logged user by a local image', (done) => {
			request.post(api('users.setAvatar'))
				.set(userCredentials)
				.attach('image', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should update the avatar of another user by userId when the logged user has the necessary permission (edit-other-user-info)', (done) => {
			request.post(api('users.setAvatar'))
				.set(userCredentials)
				.attach('image', imgURL)
				.field({ userId: credentials['X-User-Id'] })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should set the avatar of another user by username and local image when the logged user has the necessary permission (edit-other-user-info)', (done) => {
			request.post(api('users.setAvatar'))
				.set(credentials)
				.attach('image', imgURL)
				.field({ username: adminUsername })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it.skip('should prevent from updating someone else\'s avatar when the logged user has not the necessary permission(edit-other-user-info)', (done) => {
			updatePermission('edit-other-user-info', []).then(() => {
				request.post(api('users.setAvatar'))
					.set(userCredentials)
					.attach('image', imgURL)
					.field({ userId: credentials['X-User-Id'] })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
	});

	describe('[/users.update]', () => {
		before((done) => {
			updateSetting('Accounts_AllowUserProfileChange', true)
				.then(() => updateSetting('Accounts_AllowUsernameChange', true))
				.then(() => updateSetting('Accounts_AllowRealNameChange', true))
				.then(() => updateSetting('Accounts_AllowUserStatusMessageChange', true))
				.then(() => updateSetting('Accounts_AllowEmailChange', true))
				.then(() => updateSetting('Accounts_AllowPasswordChange', true))
				.then(done);
		});
		after((done) => {
			updateSetting('Accounts_AllowUserProfileChange', true)
				.then(() => updateSetting('Accounts_AllowUsernameChange', true))
				.then(() => updateSetting('Accounts_AllowRealNameChange', true))
				.then(() => updateSetting('Accounts_AllowUserStatusMessageChange', true))
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
					expect(res.body).to.not.have.nested.property('user.e2e');
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
					expect(res.body).to.not.have.nested.property('user.e2e');
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
					expect(res.body).to.not.have.nested.property('user.e2e');
				})
				.end(done);
		});

		it('should return an error when trying update username and it is not allowed', (done) => {
			updatePermission('edit-other-user-info', ['user']).then(() => {
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
		});

		it('should update the user name when the required permission is applied', (done) => {
			updatePermission('edit-other-user-info', ['admin']).then(() => {
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
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
			});
		});

		it('should return an error when trying update user real name and it is not allowed', (done) => {
			updatePermission('edit-other-user-info', ['user']).then(() => {
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
		});

		it('should update user real name when the required permission is applied', (done) => {
			updatePermission('edit-other-user-info', ['admin']).then(() => {
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
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
			});
		});

		it('should return an error when trying update user status message and it is not allowed', (done) => {
			updatePermission('edit-other-user-info', ['user']).then(() => {
				updateSetting('Accounts_AllowUserStatusMessageChange', false)
					.then(() => {
						request.post(api('users.update'))
							.set(credentials)
							.send({
								userId: targetUser._id,
								data: {
									statusMessage: 'a new status',
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

		it('should update user status message when the required permission is applied', (done) => {
			updatePermission('edit-other-user-info', ['admin']).then(() => {
				updateSetting('Accounts_AllowUserStatusMessageChange', false)
					.then(() => {
						request.post(api('users.update'))
							.set(credentials)
							.send({
								userId: targetUser._id,
								data: {
									name: 'a new status',
								},
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

		it('should return an error when trying update user email and it is not allowed', (done) => {
			updatePermission('edit-other-user-info', ['user']).then(() => {
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
		});

		it('should update user email when the required permission is applied', (done) => {
			updatePermission('edit-other-user-info', ['admin']).then(() => {
				updateSetting('Accounts_AllowEmailChange', false)
					.then(() => {
						request.post(api('users.update'))
							.set(credentials)
							.send({
								userId: targetUser._id,
								data: {
									email: apiEmail,
								},
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

		it('should return an error when trying update user password and it is not allowed', (done) => {
			updatePermission('edit-other-user-password', ['user']).then(() => {
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
		});

		it('should update user password when the required permission is applied', (done) => {
			updatePermission('edit-other-user-password', ['admin']).then(() => {
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
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
			});
		});

		it('should return an error when trying update profile and it is not allowed', (done) => {
			updatePermission('edit-other-user-info', ['user']).then(() => {
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

		it('should update profile when the required permission is applied', (done) => {
			updatePermission('edit-other-user-info', ['admin']).then(() => {
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
							.expect(200)
							.expect((res) => {
								expect(res.body).to.have.property('success', true);
							})
							.end(done);
					});
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

		it('enabling E2E in server and generating keys to user...', (done) => {
			updateSetting('E2E_Enable', true).then(() => {
				request.post(api('e2e.setUserPublicAndPrivateKeys'))
					.set(userCredentials)
					.send({
						private_key: 'test',
						public_key: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

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
					expect(user).to.not.have.property('e2e');
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
					expect(user).to.not.have.property('e2e');
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
					expect(user).to.not.have.property('e2e');
				})
				.end(done);
		});
	});

	describe('[/users.setPreferences]', () => {
		it('should return an error when the user try to update info of another user and does not have the necessary permission', (done) => {
			const userPreferences = {
				userId: 'rocket.cat',
				data: {
					...preferences.data,
				},
			};
			updatePermission('edit-other-user-info', []).then(() => {
				request.post(api('users.setPreferences'))
					.set(credentials)
					.send(userPreferences)
					.expect(400)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Editing user is not allowed [error-action-not-allowed]');
						expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an error when the user try to update info of an inexistent user', (done) => {
			const userPreferences = {
				userId: 'invalid-id',
				data: {
					...preferences.data,
				},
			};
			updatePermission('edit-other-user-info', ['admin', 'user']).then(() => {
				request.post(api('users.setPreferences'))
					.set(credentials)
					.send(userPreferences)
					.expect(400)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'The optional \"userId\" param provided does not match any users [error-invalid-user]');
						expect(res.body).to.have.property('errorType', 'error-invalid-user');
					})
					.end(done);
			});
		});
		it('should set some preferences of another user successfully', (done) => {
			const userPreferences = {
				userId: 'rocket.cat',
				data: {
					...preferences.data,
				},
			};
			updatePermission('edit-other-user-info', ['admin', 'user']).then(() => {
				request.post(api('users.setPreferences'))
					.set(credentials)
					.send(userPreferences)
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body.user).to.have.property('settings');
						expect(res.body.user.settings).to.have.property('preferences');
						expect(res.body.user._id).to.be.equal('rocket.cat');
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
		it('should set some preferences by user when execute successfully', (done) => {
			const userPreferences = {
				userId: credentials['X-User-Id'],
				data: {
					...preferences.data,
				},
			};
			request.post(api('users.setPreferences'))
				.set(credentials)
				.send(userPreferences)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body.user).to.have.property('settings');
					expect(res.body.user.settings).to.have.property('preferences');
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should set some preferences and language preference by user when execute successfully', (done) => {
			const userPreferences = {
				userId: credentials['X-User-Id'],
				data: {
					...preferences.data,
					language: 'en',
				},
			};
			request.post(api('users.setPreferences'))
				.set(credentials)
				.send(userPreferences)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.user.settings.preferences).to.have.property('language', 'en');
				})
				.end(done);
		});
	});

	describe('[/users.getPreferences]', () => {
		it('should return all preferences when execute successfully', (done) => {
			const userPreferences = {
				...preferences.data,
				language: 'en',
			};
			request.get(api('users.getPreferences'))
				.set(credentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body.preferences).to.be.eql(userPreferences);
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
				.end(wait(done, 200));
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

		it('should delete user own account when the SHA256 hash is in upper case', (done) => {
			createUser().then((user) => {
				login(user.username, password).then((createdUserCredentials) => {
					request.post(api('users.deleteOwnAccount'))
						.set(createdUserCredentials)
						.send({
							password: crypto.createHash('sha256').update(password, 'utf8').digest('hex').toUpperCase(),
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
		const testUsername = `testuserdelete${ +new Date() }`;
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
			describe('[/users.getPersonalAccessTokens]', () => {
				it('should return an array when the user does not have personal tokens configured', (done) => {
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
			it('Grant necessary permission "create-personal-accss-tokens" to user', () => updatePermission('create-personal-access-tokens', ['admin']));
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
			it('Remove necessary permission "create-personal-accss-tokens" to user', () => updatePermission('create-personal-access-tokens', []));
			describe('should return an error when the user dont have the necessary permission "create-personal-access-tokens"', () => {
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
							expect(res.body.errorType).to.be.equal('not-authorized');
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
							expect(res.body.errorType).to.be.equal('not-authorized');
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
							expect(res.body.errorType).to.be.equal('not-authorized');
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
							expect(res.body.errorType).to.be.equal('not-authorized');
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
							expect(res.body.errorType).to.be.equal('not-authorized');
						})
						.end(done);
				});
			});
		});
	});

	describe('[/users.setActiveStatus]', () => {
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
		before((done) => {
			updatePermission('edit-other-user-active-status', ['admin', 'user']).then(done);
		});
		after((done) => {
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(() => updatePermission('edit-other-user-active-status', ['admin']).then(done));
			user = undefined;
		});
		it('should set other user active status to false when the logged user has the necessary permission(edit-other-user-active-status)', (done) => {
			request.post(api('users.setActiveStatus'))
				.set(userCredentials)
				.send({
					activeStatus: false,
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.active', false);
				})
				.end(done);
		});
		it('should set other user active status to true when the logged user has the necessary permission(edit-other-user-active-status)', (done) => {
			request.post(api('users.setActiveStatus'))
				.set(userCredentials)
				.send({
					activeStatus: true,
					userId: targetUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user.active', true);
				})
				.end(done);
		});
		it('should return an error when trying to set other user active status and has not the necessary permission(edit-other-user-active-status)', (done) => {
			updatePermission('edit-other-user-active-status', []).then(() => {
				request.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: targetUser._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an error when trying to set user own active status and has not the necessary permission(edit-other-user-active-status)', (done) => {
			request.post(api('users.setActiveStatus'))
				.set(userCredentials)
				.send({
					activeStatus: false,
					userId: user._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should set user own active status to false when the user has the necessary permission(edit-other-user-active-status)', (done) => {
			updatePermission('edit-other-user-active-status', ['admin']).then(() => {
				request.post(api('users.setActiveStatus'))
					.set(userCredentials)
					.send({
						activeStatus: false,
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
	});

	describe('[/users.requestDataDownload]', () => {
		it('should return the request data with fullExport false when no query parameter was send', (done) => {
			request.get(api('users.requestDataDownload'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('requested');
					expect(res.body).to.have.property('exportOperation').and.to.be.an('object');
					expect(res.body.exportOperation).to.have.property('fullExport', false);
				})
				.end(done);
		});
		it('should return the request data with fullExport false when the fullExport query parameter is false', (done) => {
			request.get(api('users.requestDataDownload?fullExport=false'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('requested');
					expect(res.body).to.have.property('exportOperation').and.to.be.an('object');
					expect(res.body.exportOperation).to.have.property('fullExport', false);
				})
				.end(done);
		});
		it('should return the request data with fullExport true when the fullExport query parameter is true', (done) => {
			request.get(api('users.requestDataDownload?fullExport=true'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('requested');
					expect(res.body).to.have.property('exportOperation').and.to.be.an('object');
					expect(res.body.exportOperation).to.have.property('fullExport', true);
				})
				.end(done);
		});
	});

	describe('[/users.autocomplete]', () => {
		it('should return an empty list when the user does not have the necessary permission', (done) => {
			updatePermission('view-outside-room', []).then(() => {
				request.get(api('users.autocomplete?selector={}'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('items').and.to.be.an('array').that.has.lengthOf(0);
					})
					.end(done);
			});
		});
		it('should return an error when the required parameter "selector" is not provided', (done) => {
			updatePermission('view-outside-room', ['admin', 'user']).then(() => {
				request.get(api('users.autocomplete'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('The \'selector\' param is required');
					})
					.end(done);
			});
		});
		it('should return the users to fill auto complete', (done) => {
			request.get(api('users.autocomplete?selector={}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/users.getStatus]', () => {
		it('should return my own status', (done) => {
			request.get(api('users.getStatus'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status');
					expect(res.body._id).to.be.equal(credentials['X-User-Id']);
				})
				.end(done);
		});
		it('should return other user status', (done) => {
			request.get(api('users.getStatus?userId=rocket.cat'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('status');
					expect(res.body._id).to.be.equal('rocket.cat');
				})
				.end(done);
		});
	});

	describe('[/users.setStatus]', () => {
		let user;
		before((done) => {
			createUser()
				.then((createdUser) => {
					user = createdUser;
					done();
				});
		});
		it('should return an error when the setting "Accounts_AllowUserStatusMessageChange" is disabled', (done) => {
			updateSetting('Accounts_AllowUserStatusMessageChange', false).then(() => {
				request.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: '',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('error-not-allowed');
						expect(res.body.error).to.be.equal('Change status is not allowed [error-not-allowed]');
					})
					.end(done);
			});
		});
		it('should update my own status', (done) => {
			updateSetting('Accounts_AllowUserStatusMessageChange', true).then(() => {
				request.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						getUserStatus(credentials['X-User-Id']).then((status) => expect(status.status).to.be.equal('busy'));
					})
					.end(done);
			});
		});
		it('should return an error when trying to update other user status without the required permission', (done) => {
			updatePermission('edit-other-user-info', []).then(() => {
				request.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: 'test',
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should update another user status succesfully', (done) => {
			updatePermission('edit-other-user-info', ['admin']).then(() => {
				request.post(api('users.setStatus'))
					.set(credentials)
					.send({
						status: 'busy',
						message: 'test',
						userId: user._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						getUserStatus(credentials['X-User-Id']).then((status) => {
							expect(status.status).to.be.equal('busy');
							expect(status.message).to.be.equal('test');
						});
					})
					.end(done);
			});
		});
		it('should return an error when the user try to update user status with an invalid status', (done) => {
			request.post(api('users.setStatus'))
				.set(credentials)
				.send({
					status: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-invalid-status');
					expect(res.body.error).to.be.equal('Valid status types include online, away, offline, and busy. [error-invalid-status]');
				})
				.end(done);
		});
	});

	describe('[/users.removeOtherTokens]', () => {
		let user;
		let userCredentials;
		let newCredentials;

		before(async () => {
			user = await createUser();
			userCredentials = await login(user.username, password);
			newCredentials = await login(user.username, password);
		});
		after(async () => {
			await deleteUser(user);
			user = undefined;
		});

		it('should invalidate all active sesions', (done) => {
			/* We want to validate that the login with the "old" credentials fails
			However, the removal of the tokens is done asynchronously.
			Thus, we check that within the next seconds, at least one try to
			access an authentication requiring route fails */
			let counter = 0;

			async function checkAuthenticationFails() {
				const result = await request.get(api('me'))
					.set(userCredentials);
				return result.statusCode === 401;
			}

			async function tryAuthentication() {
				if (await checkAuthenticationFails()) {
					done();
				} else if (++counter < 20) {
					setTimeout(tryAuthentication, 1000);
				} else {
					done('Session did not invalidate in time');
				}
			}

			request.post(api('users.removeOtherTokens'))
				.set(newCredentials)
				.expect(200)
				.then(tryAuthentication);
		});
	});
});
