import sideNav from '../pageobjects/side-nav.page';
import flexTab from '../pageobjects/flex-tab.page';
import admin from '../pageobjects/administration.page';
import mainContent from '../pageobjects/main-content.page';
import { checkIfUserIsValid } from '../../data/checks';
import { username, email, password, adminUsername, adminEmail, adminPassword } from '../../data/user.js';

describe.skip('[Permissions]', () => {
	before(() => {
		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
		sideNav.general.click();
		sideNav.accountMenu.click();
		sideNav.admin.click();
	});

	after(() => {
		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
		sideNav.general.click();
		sideNav.accountMenu.click();
		sideNav.admin.click();
		admin.permissionsLink.click();

		if (!admin.rolesUserCreateC.isSelected()) {
			admin.rolesUserCreateC.scrollIntoView();
			admin.rolesUserCreateC.click();
		}

		if (!admin.rolesUserCreateD.isSelected()) {
			admin.rolesUserCreateD.scrollIntoView();
			admin.rolesUserCreateD.click();
		}

		if (!admin.rolesUserCreateP.isSelected()) {
			admin.rolesUserCreateP.scrollIntoView();
			admin.rolesUserCreateP.click();
		}

		if (!admin.rolesUserMentionAll.isSelected()) {
			admin.rolesUserMentionAll.scrollIntoView();
			admin.rolesUserMentionAll.click();
		}

		if (!admin.rolesOwnerDeleteMessage.isSelected()) {
			admin.rolesOwnerDeleteMessage.scrollIntoView();
			admin.rolesOwnerDeleteMessage.click();
		}

		if (!admin.rolesOwnerEditMessage.isSelected()) {
			admin.rolesOwnerEditMessage.scrollIntoView();
			admin.rolesOwnerEditMessage.click();
		}
	});

	describe('user creation via admin view:', () => {
		before(() => {
			admin.usersLink.click();
			flexTab.usersAddUserTab.click();
		});

		after(() => {
			admin.infoLink.click();
		});

		it('it should create a user', () => {
			flexTab.usersAddUserName.type(`adminCreated${username}`);
			flexTab.usersAddUserUsername.type(`adminCreated${username}`);
			flexTab.usersAddUserEmail.type(`adminCreated${email}`);
			flexTab.usersAddUserVerifiedCheckbox.click();
			flexTab.usersAddUserPassword.type(password);
			flexTab.usersAddUserChangePasswordCheckbox.click();
			flexTab.addRole('user');
			flexTab.usersButtonSave.click();
		});

		it('it should show the user in the list', () => {
			admin.checkUserList(username).should.be.true;
		});
	});

	describe('change the permissions:', () => {
		before(() => {
			admin.permissionsLink.click();
		});

		it('it should change the create c room permission', () => {
			if (admin.rolesUserCreateC.isSelected()) {
				admin.rolesUserCreateC.scrollIntoView();
				admin.rolesUserCreateC.click();
			}
		});

		it('it should change the create d room permission', () => {
			if (admin.rolesUserCreateD.isSelected()) {
				admin.rolesUserCreateD.scrollIntoView();
				admin.rolesUserCreateD.click();
			}
		});

		it('it should change the create p room permission', () => {
			if (admin.rolesUserCreateP.isSelected()) {
				admin.rolesUserCreateP.scrollIntoView();
				admin.rolesUserCreateP.click();
			}
		});

		it('it should change the mention all permission', () => {
			if (admin.rolesUserMentionAll.isSelected()) {
				admin.rolesUserMentionAll.scrollIntoView();
				admin.rolesUserMentionAll.click();
			}
		});

		it('it should change the delete message all permission for owners', () => {
			if (admin.rolesOwnerDeleteMessage.isSelected()) {
				admin.rolesOwnerDeleteMessage.scrollIntoView();
				admin.rolesOwnerDeleteMessage.click();
			}
		});

		it('it should change the edit message all permission for owners', () => {
			if (admin.rolesOwnerEditMessage.isSelected()) {
				admin.rolesOwnerEditMessage.scrollIntoView();
				admin.rolesOwnerEditMessage.click();
			}
		});
	});

	describe('test the permissions:', () => {
		before(() => {
			sideNav.preferencesClose.click();

			checkIfUserIsValid(`adminCreated${username}`, `adminCreated${email}`, password);
		});

		it('it should not show the plus icon on toolbar ', () => {
			sideNav.newChannelIcon.should('not.exist');
		});

		it('it should go to general', () => {
			sideNav.searchChannel('general');
		});

		it('it should try to use @all and should be warned by rocket.cat ', () => {
			mainContent.tryToMentionAll();
		});

		it.skip('it should not be able to delete own message ', () => {
			// waiting for changes in the delete-message permission
		});

		it.skip('it should not be able to edit own message ', () => {
			// waiting for changes in the edit-message permission
		});
	});
});
