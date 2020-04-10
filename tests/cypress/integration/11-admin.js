import sideNav from '../pageobjects/side-nav.page';
import flexTab from '../pageobjects/flex-tab.page';
import admin from '../pageobjects/administration.page';
import { checkIfUserIsValid } from '../../data/checks';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

describe('[Administration]', () => {
	before(() => {
		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
	});

	after(() => {
		sideNav.preferencesClose.click();
	});

	describe('[Admin View]', () => {
		before(() => {
			sideNav.sidebarMenu.click();
		});

		it('it should enter the admin view', () => {
			sideNav.admin.click();
		});

		describe('info:', () => {
			before(() => {
				admin.infoLink.click();
			});
			it('the first title should be Rocket.Chat', () => {
				admin.infoRocketChatTableTitle.should('contain', 'Rocket.Chat');
			});

			it('it should show the rocket chat table', () => {
				admin.infoRocketChatTable.should('be.visible');
			});

			it('the second title should be Commit', () => {
				admin.infoCommitTableTitle.should('contain', 'Commit');
			});

			it('it should show the Commit table', () => {
				admin.infoCommitTable.should('be.visible');
			});

			it('the first title should be Runtime Environment', () => {
				admin.infoRuntimeTableTitle.scrollIntoView();
				admin.infoRuntimeTableTitle.should('contain', 'Runtime Environment');
			});

			it('it should show the Runtime Environment table', () => {
				admin.infoRuntimeTable.should('be.visible');
			});

			it('the first title should be Build Environment', () => {
				admin.infoBuildTableTitle.scrollIntoView();
				admin.infoBuildTableTitle.should('contain', 'Build Environment');
			});

			it('it should show the Build Environment table', () => {
				admin.infoBuildTable.should('be.visible');
			});
		});

		describe.skip('[Rooms]', () => {
			before(() => {
				admin.roomsLink.click();
			});

			after(() => {
				admin.infoLink.click();
			});

			describe('render:', () => {
				it('it should show the search form', () => {
					admin.roomsSearchForm.should('be.visible');
				});

				it('it should show the rooms Filter', () => {
					admin.roomsFilter.should('be.visible');
				});

				it('it should show the channel checkbox', () => {
					admin.roomsChannelsCheckbox.should('be.visible');
				});

				it('it should show the direct messsage checkbox', () => {
					admin.roomsDirectCheckbox.should('be.visible');
				});

				it('it should show the Private channel checkbox', () => {
					admin.roomsPrivateCheckbox.should('be.visible');
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.should('be.visible');
				});
			});

			describe('filter text:', () => {
				before(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('general');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('');
				});

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.should('be.visible');
				});
			});

			describe('filter text with wrong channel:', () => {
				before(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('something else');
				});

				after(() => {
					admin.roomsFilter.click();
					admin.roomsFilter.type('');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.should('not.be.visible');
				});
			});

			describe('filter checkbox:', () => {
				let checkbox = 1;
				before(() => {
					admin.roomsFilter.type('');
					// add value triggers a key event that changes search±±±±±±±±±
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

				it('it should show the general channel', () => {
					admin.roomsGeneralChannel.should('be.visible');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.should('not.be.visible');
				});

				it('it should not show the general channel', () => {
					admin.roomsGeneralChannel.should('not.be.visible');
				});
			});
		});

		describe.skip('[Users]', () => {
			before(() => {
				admin.usersLink.waitForVisible(5000);
				admin.usersLink.click();
				admin.usersFilter.waitForVisible(5000);
			});

			after(() => {
				admin.infoLink.click();
			});

			it('it should show the search form', () => {
				admin.usersFilter.should('be.visible');
			});


			it('it should show rocket.cat', () => {
			// it cant find the user if there is too many users
				admin.usersRocketCat.should('be.visible');
			});

			describe('filter text:', () => {
				before(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('Rocket.Cat');
				});

				after(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('');
				});

				it('it should show rocket.cat', () => {
					admin.usersRocketCat.waitForVisible();
					admin.usersRocketCat.should('be.visible');
				});
			});

			describe('filter text with wrong user:', () => {
				before(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('something else');
				});

				after(() => {
					admin.usersFilter.click();
					admin.usersFilter.type('');
				});

				it('it should not show rocket.cat', () => {
					admin.usersRocketCat.should('not.be.visible');
				});
			});

			describe('[Flex Tab] ', () => {
				describe('send invitation:', () => {
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

					it('it should show the send invitation text area', () => {
						flexTab.usersSendInvitationTextArea.should('be.visible');
					});

					it('it should show the cancel button', () => {
						flexTab.usersButtonCancel.should('be.visible');
					});

					it('it should show the send button', () => {
						flexTab.usersSendInvitationSend.should('be.visible');
					});
				});

				describe('create user:', () => {
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

					it('it should show the name field', () => {
						flexTab.usersAddUserName.should('be.visible');
					});

					it('it should show the username field', () => {
						flexTab.usersAddUserUsername.should('be.visible');
					});

					it('it should show the email field', () => {
						flexTab.usersAddUserEmail.should('be.visible');
					});

					it('it should show the verified checkbox', () => {
						flexTab.usersAddUserVerifiedCheckbox.should('be.visible');
					});

					it('it should show the password field', () => {
						flexTab.usersAddUserPassword.should('be.visible');
					});

					it('it should show the random password button', () => {
						flexTab.usersAddUserRandomPassword.should('be.visible');
					});

					it('it should show the require password change button', () => {
						flexTab.usersAddUserChangePasswordCheckbox.should('be.visible');
					});

					it('it should show the role dropdown', () => {
						flexTab.usersAddUserRoleList.waitForVisible(5000);
						flexTab.usersAddUserRoleList.should('be.visible');
					});

					it('ít should show the add role button', () => {
						flexTab.usersAddUserRoleButton.waitForVisible(5000);
						flexTab.usersAddUserRoleButton.should('be.visible');
					});

					it('it should show the join default channel checkbox', () => {
						flexTab.usersAddUserDefaultChannelCheckbox.should('be.visible');
					});

					it('it should show the send welcome checkbox', () => {
						flexTab.usersAddUserWelcomeEmailCheckbox.should('be.visible');
					});

					it('it should show the save button', () => {
						flexTab.usersButtonSave.should('be.visible');
					});

					it('it should show the cancel button', () => {
						flexTab.usersButtonCancel.should('be.visible');
					});
				});
			});
		});

		describe('[Roles]', () => {
			before(() => {
				admin.permissionsLink.click();
			});

			after(() => {
				admin.infoLink.click();
			});

			it('it should show the permissions grid', () => {
				admin.rolesPermissionGrid.should('be.visible');
			});

			it('it should show the new role button', () => {
				admin.rolesNewRolesButton.should('be.visible');
			});

			it('it should show the admin link', () => {
				admin.rolesAdmin.should('be.visible');
			});

			describe('new role:', () => {
				before(() => {
					admin.rolesNewRolesButton.click();
				});

				after(() => {
					admin.rolesReturnLink.first().click();
				});

				it('it should show the return to permissions', () => {
					admin.rolesReturnLink.should('be.visible');
				});

				it('it should show the new role name field', () => {
					admin.rolesNewRoleName.should('be.visible');
				});

				it('it should show the new role description field', () => {
					admin.rolesNewRoleDesc.should('be.visible');
				});

				it('it should show the new role scope', () => {
					admin.rolesNewRoleScope.should('be.visible');
				});
			});

			describe('admin role:', () => {
				before(() => {
					admin.rolesAdmin.click();
				});

				after(() => {
					admin.rolesReturnLink.first().click();
				});

				it('it should show internal admin', () => {
					admin.usersInternalAdmin.should('be.visible');
				});
			});
		});
	});
});
