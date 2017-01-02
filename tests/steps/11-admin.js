/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../pageobjects/side-nav.page';
import flexTab from '../pageobjects/flex-tab.page';
import admin from '../pageobjects/administration.page';

//test data imports
import {checkIfUserIsAdmin} from '../data/checks';
import {adminUsername, adminEmail, adminPassword} from '../data/user.js';

describe.only('Admin Login', () => {
	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');
	});

	describe('Enter the admin view', () => {
		before(() => {
			sideNav.accountBoxUserName.click();
			sideNav.admin.waitForVisible(5000);

		});

		it('Enter the admin view', () => {
			sideNav.admin.click();
			admin.flexNavContent.waitForVisible(5000);
		});

		describe('info', () => {
			before(() =>{
				admin.infoLink.waitForVisible(5000);
				admin.infoLink.click();
				admin.infoRocketChatTable.waitForVisible(5000);
			});
			it('the first title should be Rocket.Chat', () => {
				admin.infoRocketChatTableTitle.getText().should.equal('Rocket.Chat');
			});

			it('should show the rocket chat table', () => {
				admin.infoRocketChatTable.isVisible().should.be.true;
			});

			it('the second title should be Commit', () => {
				admin.infoCommitTableTitle.getText().should.equal('Commit');
			});

			it('should show the Commit table', () => {
				admin.infoCommitTable.isVisible().should.be.true;
			});

			it('the first title should be Runtime_Environment', () => {
				admin.infoRuntimeTableTitle.getText().should.equal('Runtime_Environment');
			});

			it('should show the Runtime_Environment table', () => {
				admin.infoRuntimeTable.isVisible().should.be.true;
			});

			it('the first title should be Build_Environment', () => {
				admin.infoBuildTableTitle.getText().should.equal('Build_Environment');
			});

			it('should show the Build_Environment table', () => {
				admin.infoBuildTable.isVisible().should.be.true;
			});
		});

		describe('rooms', () => {
			before(() => {
				admin.roomsLink.waitForVisible(5000);
				admin.roomsLink.click();
				admin.roomsFilter.waitForVisible(5000);
			});

			after(() => {
				admin.infoLink.click();
			});
			describe('render', () => {
				it('should show the search form', () => {
					admin.roomsSearchForm.isVisible().should.be.true;
				});

				it('should show the rooms Filter', () => {
					admin.roomsFilter.isVisible().should.be.true;
				});

				it('should show the channel checkbox', () => {
					admin.roomsChannelsCheckbox.isVisible().should.be.true;
				});

				it('should show the direct messsage checkbox', () => {
					admin.roomsDirectCheckbox.isVisible().should.be.true;
				});

				it('should show the Private channel checkbox', () => {
					admin.roomsPrivateCheckbox.isVisible().should.be.true;
				});

				it('should show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.true;
				});
			});

			describe('filter text', () => {
				before(() => {
					admin.roomsFilter.click();
					browser.pause(5000);
					admin.roomsFilter.setValue('general');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.setValue('');
				});

				it('should show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.true;
				});
			});

			describe('filter text with wrong channel', () => {
				before(() => {
					admin.roomsFilter.click();
					browser.pause(5000);
					admin.roomsFilter.setValue('something else');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.setValue('');
				});

				it('should not show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.false;
				});
			});
			describe('filter checkbox', () => {
				var checkbox = 1;
				before(() => {
					admin.roomsFilter.setValue('');
					//add value triggers a key event that changes search±±±±±±±±±
					admin.roomsFilter.addValue(' ');
					admin.roomsGeneralChannel.waitForVisible(5000);
				});
				beforeEach(() => {
					switch (checkbox) {
						case 1:
							admin.roomsChannelsCheckbox.click();
							break;
						case 2:
							admin.roomsDirectCheckbox.click();
							break;
						case 3:
							admin.roomsPrivateCheckbox.click();
							break;
					}
				});

				afterEach(() => {
					switch (checkbox) {
						case 1:
							admin.roomsChannelsCheckbox.click();
							checkbox ++;
							break;
						case 2:
							admin.roomsDirectCheckbox.click();
							checkbox ++;
							break;
						case 3:
							admin.roomsPrivateCheckbox.click();
							break;
					}
				});

				it('should show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.true;
				});

				it('should not show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.false;
				});

				it('should not show the general channel', () => {
					admin.roomsGeneralChannel.isVisible().should.be.false;
				});
			});
			describe('users', () => {
				before(() => {
					admin.usersLink.waitForVisible(5000);
					admin.usersLink.click();
					admin.usersFilter.waitForVisible(5000);
				});

				after(() => {
					admin.infoLink.click();
				});

				it('should show the search form', () => {
					admin.usersFilter.isVisible().should.be.true;
				});


				it('should show rocket.cat', () => {
					admin.usersRocketCat.isVisible().should.be.true;
				});

				describe('filter text', () => {
					before(() => {
						admin.usersFilter.click();
						browser.pause(5000);
						admin.usersFilter.setValue('Rocket.Cat');
					});

					after(() => {
						admin.usersFilter.click();
						admin.usersFilter.setValue('');
					});

					it('should show rocket.cat', () => {
						admin.usersRocketCat.waitForVisible();
						admin.usersRocketCat.isVisible().should.be.true;
					});
				});

				describe('filter text with wrong user', () => {
					before(() => {
						admin.usersFilter.click();
						browser.pause(5000);
						admin.usersFilter.setValue('something else');
					});

					after(() => {
						admin.usersFilter.click();
						admin.usersFilter.setValue('');
					});

					it('should not show rocket.cat', () => {
						admin.usersRocketCat.isVisible().should.be.false;
					});
				});

				describe('users flex tab ', () => {
					describe('send invitation', () => {
						before(() => {
							flexTab.usersSendInvitationTab.waitForVisible(5000);
							flexTab.usersSendInvitationTab.click();
							flexTab.usersSendInvitationTextArea.waitForVisible(5000);
						});

						after(() => {
							flexTab.usersSendInvitationTab.waitForVisible(5000);
							flexTab.usersSendInvitationTab.click();
							flexTab.usersSendInvitationTextArea.waitForVisible(5000, true);
						});

						it('should show the send invitation text area', () => {
							flexTab.usersSendInvitationTextArea.isVisible().should.be.true;
						});

						it('should show the cancel button', () => {
							flexTab.usersButtonCancel.isVisible().should.be.true;
						});

						it('should show the send button', () => {
							flexTab.usersSendInvitationSend.isVisible().should.be.true;
						});
					});
					describe('create user ', () => {
						before(() => {
							flexTab.usersAddUserTab.waitForVisible(5000);
							flexTab.usersAddUserTab.click();
							flexTab.usersAddUserName.waitForVisible(5000);
						});

						after(() => {
							flexTab.usersAddUserTab.waitForVisible(5000);
							flexTab.usersAddUserTab.click();
							flexTab.usersAddUserName.waitForVisible(5000, true);
						});

						it('should show the name field', () => {
							flexTab.usersAddUserName.isVisible().should.be.true;
						});

						it('should show the username field', () => {
							flexTab.usersAddUserUsername.isVisible().should.be.true;
						});

						it('should show the email field', () => {
							flexTab.usersAddUserEmail.isVisible().should.be.true;
						});

						it('should show the verified checkbox', () => {
							flexTab.usersAddUserVerifiedCheckbox.isVisible().should.be.true;
						});

						it('should show the password field', () => {
							flexTab.usersAddUserPassword.isVisible().should.be.true;
						});

						it('should show the random password button', () => {
							flexTab.usersAddUserRandomPassword.isVisible().should.be.true;
						});

						it('should show the require password change button', () => {
							flexTab.usersAddUserChangePasswordCheckbox.isVisible().should.be.true;
						});

						it('should show the role dropdown', () => {
							flexTab.usersAddUserRole.isVisible().should.be.true;
						});

						it('should show the join default channel checkbox', () => {
							flexTab.usersAddUserDefaultChannelCheckbox.isVisible().should.be.true;
						});

						it('should show the send welcome checkbox', () => {
							flexTab.usersAddUserWelcomeEmailCheckbox.isVisible().should.be.true;
						});

						it('should show the save button', () => {
							flexTab.usersButtonSave.isVisible().should.be.true;
						});

						it('should show the cancel button', () => {
							flexTab.usersButtonCancel.isVisible().should.be.true;
						});
					});
				});
			});

			describe('roles', () => {
				before(() =>{
					admin.permissionsLink.waitForVisible(5000);
					admin.permissionsLink.click();
					admin.rolesPermissionGrid.waitForVisible(5000);
				});

				after(() => {
					admin.infoLink.click();
				});

				it('should show the permissions grid', () => {
					admin.rolesPermissionGrid.isVisible().should.be.true;
				});

				it('should show the new role button', () => {
					admin.rolesNewRolesButton.isVisible().should.be.true;
				});
			});
		});
	});
});


/*class Administration extends Page {
	get flexNav() { return browser.element('.flex-nav'); }
	get flexNavContent() { return browser.element('.flex-nav .content'); }
	get layoutLink() { return browser.element('.flex-nav .content [href="/admin/Layout"]'); }
	get infoLink() { return browser.element('.flex-nav .content [href="/admin/info"]'); }
	get roomsLink() { return browser.element('.flex-nav .content [href="/admin/rooms"]'); }
	get usersLink() { return browser.element('.flex-nav .content [href="/admin/users"]'); }
	get permissionsLink() { return browser.element('.flex-nav .content [href="/admin/permissions"]'); }
	get customScriptBtn() { return browser.element('.section:nth-of-type(6) .expand'); }
	get customScriptLoggedOutTextArea() { return browser.element('.section:nth-of-type(6) .CodeMirror-scroll'); }
	get customScriptLoggedInTextArea() { return browser.element('.CodeMirror.cm-s-default:nth-of-type(2)'); }
	get infoRocketChatTableTitle() { return browser.element('.content h3'); }
	get infoRocketChatTable() { return browser.element('.content .statistics-table'); }
	get infoCommitTableTitle() { return browser.element('.content h3:nth-of-type(2)'); }
	get infoCommitTable() { return browser.element('.content .statistics-table:nth-of-type(2)'); }
	get infoRuntimeTableTitle() { return browser.element('.content h3:nth-of-type(3)'); }
	get infoRuntimeTable() { return browser.element('.content .statistics-table:nth-of-type(3)'); }
	get infoBuildTableTitle() { return browser.element('.content h3:nth-of-type(4)'); }
	get infoBuildTable() { return browser.element('.content .statistics-table:nth-of-type(4)'); }
	get infoUsageTableTitle() { return browser.element('.content h3:nth-of-type(5)'); }
	get infoUsageTable() { return browser.element('.content .statistics-table:nth-of-type(5)'); }
	get roomsSearchForm() { return browser.element('.content .search'); }
	get roomsFilter() { return browser.element('#rooms-filter'); }
	get roomsChannelsCheckbox() { return browser.element('label:nth-of-type(1) input[name="room-type"]'); }
	get roomsDirectCheckbox() { return browser.element('label:nth-of-type(2) input[name="room-type"]'); }
	get roomsPrivateCheckbox() { return browser.element('label:nth-of-type(3) input[name="room-type"]'); }
	get roomsGeneralChannel() { return browser.element('td=general'); }
	get usersRocketCat() { return browser.element('td=Rocket.Cat'); }
	get usersFilter() { return browser.element('#users-filter'); }
	get rolesNewRolesButton() { return browser.element('.button.new-role'); }
	get rolesPermissionGrid() { return browser.element('.permission-grid'); }
	get rolesAdmin() { return browser.element('[title="Admin"]'); }
	get rolesModerator() { return browser.element('[title="Moderator"]'); }
	get rolesOwner() { return browser.element('[title="Owner"]'); }
	get rolesReturnLink() { return browser.element('[href="/admin/permissions"]'); }
	get rolesNewRoleName() { return browser.element('[name="name"]'); }
	get rolesNewRoleDesc() { return browser.element('[name="description"]'); }
	get rolesNewRoleScope() { return browser.element('[name="scope"]'); }
	get rolesAddBtn() { return browser.element('button.add'); }
	get rolesRoomsSearchForm() { return browser.element('.search [name="room"]'); }
	get emojiFilter() { return browser.element('#emoji-filter'); }
	get emojiFilter() { return browser.element('#emoji-filter'); }


}
*/
