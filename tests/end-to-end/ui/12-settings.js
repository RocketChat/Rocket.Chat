/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import loginPage from '../../pageobjects/login.page';
import supertest from 'supertest';
const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import admin from '../../pageobjects/administration.page';

//test data imports
import {checkIfUserIsValid, checkIfUserIsAdmin} from '../../data/checks';
import {targetUser, imgURL} from '../../data/interactions.js';

import {adminUsername, adminEmail, adminPassword, username, email, password} from '../../data/user.js';

function api(path) {
	return prefix + path;
}

function log(res) {
	console.log(res.req.path);
	console.log({
		body: res.body,
		headers: res.headers
	});
}

const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};

const login = {
	user: adminUsername,
	password: adminPassword
};

const settingValue = {
	value : undefined
};

describe('[Api Settings Change]', () => {
	before((done) => {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.general.waitForVisible(5000);
		sideNav.general.click();

		request.post(api('login'))
			.send(login)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				credentials['X-Auth-Token'] = res.body.data.authToken;
				credentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

	after(() => {
		sideNav.preferencesClose.waitForVisible(5000);
		sideNav.preferencesClose.click();
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.length.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.length.at.least(1);
	});

	describe('message edit:', () => {
		it('it should change the message editing via api', (done) => {
			request.post(api('settings/Message_AllowEditing'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the edit messages', () => {
		//the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message Edit Block');
			mainContent.openMessageActionMenu();
			mainContent.messageEdit.isVisible().should.be.false;
		});

		it('it should change the message editing via api', (done) => {
			request.post(api('settings/Message_AllowEditing'))
				.set(credentials)
				.send({'value' : true})
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
			request.post(api('settings/Message_AllowDeleting'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the delete messages', () => {
		//the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message delete Block');
			mainContent.openMessageActionMenu();
			mainContent.messageDelete.isVisible().should.be.false;
		});

		it('it should change the message deleting via api', (done) => {
			request.post(api('settings/Message_AllowDeleting'))
				.set(credentials)
				.send({'value' : true})
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
			request.post(api('settings/Message_AudioRecorderEnabled'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the audo file button', () => {
		//the page needs a refresh to show the changes in the client
			mainContent.recordBtn.waitForVisible(10000, true);
			mainContent.recordBtn.isVisible().should.be.false;
		});

		it('it should change the message audio files via api', (done) => {
			request.post(api('settings/Message_AudioRecorderEnabled'))
				.set(credentials)
				.send({'value' : true})
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
			request.post(api('settings/Message_VideoRecorderEnabled'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the video file button', () => {
		//the page needs a refresh to show the changes in the client
			mainContent.videoCamBtn.waitForVisible(10000, true);
			mainContent.videoCamBtn.isVisible().should.be.false;
		});

		it('it should change the message video files via api', (done) => {
			request.post(api('settings/Message_VideoRecorderEnabled'))
				.set(credentials)
				.send({'value' : true})
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
			request.post(api('settings/Message_AllowBadWordsFilter'))
				.set(credentials)
				.send({'value' : true})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should add bad words to the filter via api', (done) => {
			request.post(api('settings/Message_BadWordsFilterList'))
				.set(credentials)
				.send({'value' : 'badword'})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should send a bad word', () => {
			sideNav.general.waitForVisible(5000);
			sideNav.general.click();
			mainContent.setTextToInput('badword');
			mainContent.sendBtn.click();
			mainContent.waitForLastMessageEqualsText('*******');
		});

		it('it should change the bad words filter via api', (done) => {
			request.post(api('settings/Message_AllowBadWordsFilter'))
				.set(credentials)
				.send({'value' : false})
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
			request.post(api('settings/Message_AllowPinning'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the pinned tab button', () => {
		//the page needs a refresh to show the changes in the client
			flexTab.pinnedTab.waitForVisible(10000, true);
			flexTab.pinnedTab.isVisible().should.be.false;
		});

		it.skip('it should not show the pin message action', () => {
		//the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message pin Block');
			mainContent.openMessageActionMenu();
			mainContent.pinMessage.isVisible().should.be.false;
		});

		it('it should change the message pin via api', (done) => {
			request.post(api('settings/Message_AllowPinning'))
				.set(credentials)
				.send({'value' : true})
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
			request.post(api('settings/Message_AllowStarring'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it.skip('it should not show the starred tab button', () => {
		//the page needs a refresh to show the changes in the client
			flexTab.starredTab.waitForVisible(10000, true);
			flexTab.starredTab.isVisible().should.be.false;
		});

		it.skip('it should not show the star message action', () => {
		//the page needs a refresh to show the changes in the client
			mainContent.sendMessage('Message for Message pin Block');
			mainContent.openMessageActionMenu();
			mainContent.starMessage.isVisible().should.be.false;
		});

		it('it should change the message star via api', (done) => {
			request.post(api('settings/Message_AllowStarring'))
				.set(credentials)
				.send({'value' : true})
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
			request.post(api('settings/FileUpload_Enabled'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('it should not show file upload icon', () => {
			mainContent.fileAttachment.isVisible().should.be.false;
		});

		it('it should change the file upload via api', (done) => {
			request.post(api('settings/FileUpload_Enabled'))
				.set(credentials)
				.send({'value' : true})
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
			sideNav.accountMenu.click();
			sideNav.account.waitForVisible(5000);
			sideNav.account.click();
		});

		after(() => {
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			sideNav.avatar.waitForVisible(5000, true);
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel('general');
		});
		describe('block profile change', () => {
			it('it should change the allow user profile change via api', (done) => {
				request.post(api('settings/Accounts_AllowUserProfileChange'))
					.set(credentials)
					.send({'value' : false})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});

			it('it should not show profile link', () => {
				sideNav.profile.isVisible().should.be.false;
			});

			it('it should change the allow user profile change via api', (done) => {
				request.post(api('settings/Accounts_AllowUserProfileChange'))
					.set(credentials)
					.send({'value' : true})
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
				request.post(api('settings/Accounts_AllowUserAvatarChange'))
					.set(credentials)
					.send({'value' : false})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});

			it('it should not show avatar link', () => {
				sideNav.avatar.isVisible().should.be.false;
			});

			it('it should change the allow user avatar change via api', (done) => {
				request.post(api('settings/Accounts_AllowUserAvatarChange'))
					.set(credentials)
					.send({'value' : true})
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
			sideNav.accountMenu.waitForVisible(5000);
			sideNav.accountMenu.click();
			sideNav.logout.waitForVisible(5000);
			sideNav.logout.click();

			loginPage.open();
		});

		it('it should change the Manually Approve New Users via api', (done) => {
			request.post(api('settings/Accounts_ManuallyApproveNewUsers'))
				.set(credentials)
				.send({'value' : true})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('register the user', () => {
			loginPage.registerButton.waitForVisible(5000);
			loginPage.registerButton.click();
			loginPage.nameField.waitForVisible(5000);
			loginPage.nameField.setValue(`setting${ username }`);
			loginPage.emailField.setValue(`setting${ email }`);
			loginPage.passwordField.setValue(password);
			loginPage.confirmPasswordField.setValue(password);

			loginPage.submit();

			loginPage.registrationSucceededCard.waitForVisible(5000);
			loginPage.registrationSucceededCard.getAttribute('data-i18n').should.equal('Registration_Succeeded');
			loginPage.backToLoginButton.click();
		});

		it('login as admin and go to users', () => {
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.accountMenu.click();
			sideNav.admin.waitForVisible(5000);
			sideNav.admin.click();
			admin.usersLink.waitForVisible(5000);
			admin.usersLink.click();
			admin.usersFilter.waitForVisible(5000);
		});

		it('search the user', () => {
			admin.usersFilter.click();
			admin.usersFilter.setValue(`setting${ username }`);
		});

		it('opens the user', () => {
			const userEl = admin.getUserFromList(`setting${ username }`);
			userEl.waitForVisible(5000);
			userEl.click();
			flexTab.userViewTabButton.click();
			flexTab.usersView.waitForVisible(5000);
		});

		it('it should show the activate user btn', () => {
			flexTab.moreActions.click();
			flexTab.usersActivate.waitForVisible(5000);
			flexTab.usersActivate.isVisible().should.be.true;
		});

		it('it should activate the user', () => {
			flexTab.usersActivate.click();
		});

		it('it should show the deactivate btn', () => {
			flexTab.moreActions.click();
			flexTab.usersDeactivate.waitForVisible(5000);
			flexTab.usersDeactivate.isVisible().should.be.true;
			mainContent.popoverWrapper.click();
		});

		it('it should change the Manually Approve New Users via api', (done) => {
			request.post(api('settings/Accounts_ManuallyApproveNewUsers'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});
});
