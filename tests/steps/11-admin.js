/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../pageobjects/side-nav.page';
import admin from '../pageobjects/administration.page';

//test data imports
import {checkIfUserIsAdmin} from '../data/checks';
import {adminUsername, adminEmail, adminPassword} from '../data/user.js';

describe('Admin Login', () => {
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
			describe('filter checkbox', () => {
				var checkbox = 1;
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
						admin.usersRocketCat.isVisible().should.be.true;
					});
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
	get roomsSearchForm() { return browser.element('.content .search.form'); }
	get roomsFilter() { return browser.element('#rooms-filter'); }
	get roomsChannelsCheckbox() { return browser.element('input[name="room-type"]')[0]; }
	get roomsDirectCheckbox() { return browser.element('input[name="room-type"]')[1]; }
	get roomsChannelsCheckbox() { return browser.element('input[name="room-type"]'[2]); }
	get roomsGeneralChannel() { return browser.getText('td=general'); }
	get usersRocketCat() { return browser.getText('td=Rocket.Cat'); }
	get usersFilter() { return browser.element('#users-filter'); }


}
*/
