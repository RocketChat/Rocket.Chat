import supertest from 'supertest';

import loginPage from '../pageobjects/login.page';
import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import admin from '../pageobjects/administration.page';
import { checkIfUserIsValid } from '../../data/checks';
import { adminUsername, adminEmail, adminPassword, username, email, password, reason } from '../../data/user.js';
import { wait } from '../../data/api-data';

const apiUrl = (typeof Cypress !== 'undefined' && Cypress.env('TEST_API_URL')) || process.env.TEST_API_URL || 'http://localhost:3000';

const request = supertest(apiUrl);
const prefix = '/api/v1/';

function api(path) {
	return prefix + path;
}

const credentials = {
	'X-Auth-Token': undefined,
	'X-User-Id': undefined,
};

const login = {
	user: adminUsername,
	password: adminPassword,
};

const settingUserPrefix = `setting${Date.now()}`;

describe('[Api Settings Change]', () => {
	before((done) => {
		checkIfUserIsValid(username, email, password).then(() => {
			request
				.post(api('login'))
				.send(login)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					credentials['X-Auth-Token'] = res.body.data.authToken;
					credentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
	});

	after(() => {
		sideNav.preferencesClose.click();
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.lengthOf.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.lengthOf.at.least(1);
	});

	describe('message edit:', () => {
		it('it should change the message editing via api', (done) => {
			request
				.post(api('settings/Message_AllowEditing'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the edit messages', () => {
			// the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message Edit Block');
			mainContent.openMessageActionMenu();
			mainContent.messageEdit.should('not.exist');
		});

		it('it should change the message editing via api', (done) => {
			request
				.post(api('settings/Message_AllowEditing'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('message delete:', () => {
		it('it should change the message deleting via api', (done) => {
			request
				.post(api('settings/Message_AllowDeleting'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the delete messages', () => {
			// the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message delete Block');
			mainContent.openMessageActionMenu();
			mainContent.messageDelete.should('not.exist');
		});

		it('it should change the message deleting via api', (done) => {
			request
				.post(api('settings/Message_AllowDeleting'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('block audio files:', () => {
		it('it should change the message audio files via api', (done) => {
			request
				.post(api('settings/Message_AudioRecorderEnabled'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the audo file button', () => {
			// the page needs a refresh to show the changes in the client
			mainContent.recordBtn.should('not.exist');
		});

		it('it should change the message audio files via api', (done) => {
			request
				.post(api('settings/Message_AudioRecorderEnabled'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('block video files:', () => {
		it('it should change the message video files via api', (done) => {
			request
				.post(api('settings/Message_VideoRecorderEnabled'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should change the message video files via api', (done) => {
			request
				.post(api('settings/Message_VideoRecorderEnabled'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('bad words filter:', () => {
		it('it should change the bad words filter via api', (done) => {
			request
				.post(api('settings/Message_AllowBadWordsFilter'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should add bad words to the filter via api', (done) => {
			request
				.post(api('settings/Message_BadWordsFilterList'))
				.set(credentials)
				.send({ value: 'badword' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should send a bad word', () => {
			sideNav.general.click();
			mainContent.setTextToInput('badword');
			mainContent.sendBtn.click();
			mainContent.waitForLastMessageEqualsText('*******');
		});

		it('it should change the bad words filter via api', (done) => {
			request
				.post(api('settings/Message_AllowBadWordsFilter'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('block message pin:', () => {
		it('it should change the message pin via api', (done) => {
			request
				.post(api('settings/Message_AllowPinning'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the pinned tab button', () => {
			// the page needs a refresh to show the changes in the client
			flexTab.pinnedTab.should('not.exist');
		});

		it.skip('it should not show the pin message action', () => {
			// the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message pin Block');
			mainContent.openMessageActionMenu();
			mainContent.pinMessage.should('not.exist');
		});

		it('it should change the message pin via api', (done) => {
			request
				.post(api('settings/Message_AllowPinning'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('block message star:', () => {
		it('it should change the message star via api', (done) => {
			request
				.post(api('settings/Message_AllowStarring'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the starred tab button', () => {
			// the page needs a refresh to show the changes in the client
			flexTab.starredTab.should('not.exist');
		});

		it.skip('it should not show the star message action', () => {
			// the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message pin Block');
			mainContent.openMessageActionMenu();
			mainContent.starMessage.should('not.exist');
		});

		it('it should change the message star via api', (done) => {
			request
				.post(api('settings/Message_AllowStarring'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe.skip('block file upload:', () => {
		it('it should change the file upload via api', (done) => {
			request
				.post(api('settings/FileUpload_Enabled'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should not show file upload icon', () => {
			mainContent.fileAttachment.should('not.exist');
		});

		it('it should change the file upload via api', (done) => {
			request
				.post(api('settings/FileUpload_Enabled'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe.skip('profile changes:', () => {
		before(() => {
			sideNav.sidebarUserMenu.click();
			sideNav.account.click();
		});

		after(() => {
			sideNav.preferencesClose.click();
			sideNav.searchChannel('general');
		});
		describe('block profile change', () => {
			it('it should change the allow user profile change via api', (done) => {
				request
					.post(api('settings/Accounts_AllowUserProfileChange'))
					.set(credentials)
					.send({ value: false })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});

			it('it should not show profile link', () => {
				sideNav.profile.should('not.exist');
			});

			it('it should change the allow user profile change via api', (done) => {
				request
					.post(api('settings/Accounts_AllowUserProfileChange'))
					.set(credentials)
					.send({ value: true })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

		describe('block avatar change', () => {
			it('it should change the allow user avatar change via api', (done) => {
				request
					.post(api('settings/Accounts_AllowUserAvatarChange'))
					.set(credentials)
					.send({ value: false })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});

			it('it should not show avatar link', () => {
				sideNav.avatar.should('not.exist');
			});

			it('it should change the allow user avatar change via api', (done) => {
				request
					.post(api('settings/Accounts_AllowUserAvatarChange'))
					.set(credentials)
					.send({ value: true })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
	});

	describe('Manually Approve New Users:', () => {
		before(() => {
			sideNav.sidebarUserMenu.click();
			sideNav.logout.click();

			// loginPage.open();
		});

		it('it should change the Manually Approve New Users via api', (done) => {
			request
				.post(api('settings/Accounts_ManuallyApproveNewUsers'))
				.set(credentials)
				.send({ value: true })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('register the user', () => {
			loginPage.registerButton.click();
			loginPage.nameField.type(`${settingUserPrefix}${username}`);
			loginPage.emailField.type(`${settingUserPrefix}${email}`);
			loginPage.passwordField.type(password);
			loginPage.confirmPasswordField.type(password);
			loginPage.reasonField.type(reason);

			loginPage.submit();

			loginPage.registrationSucceededCard.should('have.attr', 'data-i18n', 'Registration_Succeeded');
			loginPage.backToLoginButton.click();
		});

		it('login as admin and go to users', () => {
			checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
			sideNav.sidebarUserMenu.click();
			sideNav.admin.click();
			admin.usersLink.click();
			cy.get('h2:contains("Users")').should('be.visible');
		});

		it('search the user', () => {
			admin.usersFilter.click();
			admin.usersFilter.type(`${settingUserPrefix}${username}`);
			cy.wait(1000);
		});

		it('opens the user', () => {
			admin.getUserFromList(`${settingUserPrefix}${username}`).click().wait(100);
			flexTab.usersView.should('be.visible');
		});

		it('it should show the activate user btn', () => {
			flexTab.moreActions.click().wait(200);
			flexTab.usersActivate.should('be.visible');
		});

		it('it should activate the user', () => {
			flexTab.usersActivate.click().wait(200);
		});

		it('it should show the deactivate btn', () => {
			flexTab.moreActions.click().wait(200);
			flexTab.usersDeactivate.should('be.visible');
		});

		it('it should change the Manually Approve New Users via api', (done) => {
			request
				.post(api('settings/Accounts_ManuallyApproveNewUsers'))
				.set(credentials)
				.send({ value: false })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(wait(done, 100));
		});
	});
});
