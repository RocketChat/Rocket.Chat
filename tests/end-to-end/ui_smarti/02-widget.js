import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';
import { checkIfUserIsAdmin } from '../../data/checks';

const topicName = 'widget-test-topic';
const question = 'Wie komme ich von Frankfurt nach Berlin?';
const question2 = 'Dortmund soll auch gefunden werden!';
const tag = 'Frankfurt';
const topicExpert = adminUsername;

describe('[Smarti Widget]', () => {

	before(() => {
		browser.pause(5000); // wait some time to make sure that all settings on both sides are actually persisted

		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Topic]', () => {
		it('Create new Topic for Testing', function() {
			try {
				sideNav.openChannel(topicName);
			} catch (e) {
				assistify.createTopic(topicName, topicExpert);
			}
		});
	});

	describe('[Request]', () => {

		describe('First request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, question);
      });
      
			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest('Danke!');

			});
		});
		describe('Second request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, question2);
				assistify.clickKnowledgebase();
			});

			it('knowledgebase answer is not visible', () => {
				assistify.clickKnowledgebase();
				assistify.knowledgebaseContent.isVisible().should.equal(false);
			});

			it('Add missing tag', () => {
				assistify.addNewKeyword(tag);
			});

			it('knowledgebase answer is visible now', () => {
				assistify.knowledgebaseContent.isVisible().should.equal(true);
			});

			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest('Danke!');
			});
		});
	});

	describe('Cleanup', () => {
		it('close new Topic', () => {
			console.log('TopicName for cleanup', topicName);
			assistify.closeTopic(topicName);
		});
	});
});
