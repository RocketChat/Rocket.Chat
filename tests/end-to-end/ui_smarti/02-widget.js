/* eslint-env mocha */
import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';
import { checkIfUserIsAdmin } from '../../data/checks';
import mainContent from '../../pageobjects/main-content.page';

const room1 = `widget-test-topic1-${ Date.now() }`;
const room2 = `widget-test-topic2-${ Date.now() }`;
const question = 'Wie komme ich von Frankfurt nach Berlin?';
const question2 = 'Dortmund soll auch gefunden werden!';
const tag = 'Frankfurt';

describe('[Smarti Widget]', () => {
	before(() => {
		browser.pause(5000); // wait some time to make sure that all settings on both sides are actually persisted

		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Request]', () => {
		describe('First request', () => {
			it('create is successful', () => {
				sideNav.createChannel(room1, false, false);
				mainContent.sendMessage(question);
			});
		});
		describe('Second request', () => {
			it('create is successful', () => {
				sideNav.createChannel(room2, false, false);
				mainContent.sendMessage(question2);
			});

			it('knowledgebase answer is not visible', () => {
				assistify.knowledgebaseTab.click();
				assistify.knowledgebaseContainer.waitForVisible(3000);
				assistify.knowledgebaseFilter.waitForVisible(5000);
				browser.pause(4000);
				assistify.knowledgebaseFilter.click();
				assistify.knowledgebaseContent.isVisible().should.equal(false);
			});

			it('Add missing tag', () => {
				assistify.addNewKeyword(tag);
			});

			it('knowledgebase answer is visible now', () => {
				let tries = 0;
				while (tries < 5) {
					try {
						assistify.knowledgebaseContent.waitForVisible(2000);
						break;
					} catch (e) {
						tries++;
						if (tries >= 5) {
							throw e;
						}
						// did not have a result yet => re-open the tab and check again
						assistify.knowledgebaseTab.click();
						assistify.knowledgebaseTab.click();
						assistify.knowledgebaseFilter.waitForVisible(5000);
						assistify.knowledgebaseFilter.click();
						assistify.knowledgebaseFilter.click();
					}
				}
				assistify.knowledgebaseContent.isVisible().should.equal(true);
			});
		});
	});
});
