/* eslint-env mocha */

import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

const topicName = 'smarti-test-topic4';
const topicExpert = 'rocketchat.internal.admin.test';
const message = 'Mit allgemeinen Anfragen verschaffen Sie sich einen Überblick über den Markt, indem Sie Produkte, Preise und Bestellbedingungen unterschiedlicher Lieferanten und Dienstleister kennen lernen. In einem allgemeinen Anfragebrief bitten Sie zum die Zusendung von Katalogen, Prospekten, Preislisten und Produktmustern. Wie kann ich dieses Wissen nutzen?';
const answer = 'Das ist die Antwort auf diese Anfrage!';
const comment = 'Anfrage wurde erfolgreich beantwortet';

import supertest from 'supertest';

export const request = supertest.agent('http://localhost:3000');

import { checkIfUserIsAdmin } from '../../data/checks';


describe('[Smarti Integration]', () => {

	before(() => {
		browser.pause(5000); // wait some time to make sure that all settings on both sides are actually persisted

		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Topic]', () => {
		before(() => {
			try {
				assistify.createTopic(topicName, topicExpert);
			} catch (e) {
				console.log(e);
				browser.pause(1000);
				sideNav.openChannel(topicName);
			}

		});

		describe('Open Topic', () => {
			it('switch to GENERAL', () => {
				browser.pause(1000);
				sideNav.openChannel('general');
			});
			it('switch back to Topic', () => {
				browser.pause(1000);
				sideNav.openChannel(topicName);
			});
		});

		describe('Message', () => {
			it('it should send a message', () => {
				assistify.clickKnowledgebase();
				assistify.sendTopicMessage(message);
			});
		});
	});

	describe('[Request]', () => {

		describe('First request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, message);
			});
			it('answer request', () => {
				assistify.sendTopicMessage(answer);
				// assistify.answerRequest(request1, answer);
			});
			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest(comment);

			});
		});
		describe('Second request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, message);
			});

			it('knowledgebase answer visible', () => {
				browser.pause(1000);
				assistify.knowledgebasePickAnswer.waitForVisible(5000);
				browser.pause(1000);
				assistify.knowledgebasePickAnswer.click();
				browser.pause(1000);
			});

			it('post knowledgebase answer', () => {
				assistify.knowledgebasePostBtn.waitForVisible(5000);
				assistify.knowledgebasePostBtn.click();
				assistify.clickKnowledgebase();
				assistify.closeRequest(comment);
			});
		});
	});

	describe.skip('Cleanup', () => {
		it('close new Topic', () => {
			console.log('TopicName for cleanup', topicName);
			assistify.closeTopic(topicName);
		});
	});

	// describe.skip('[BREAK]', () => {
	// 	it('BREAK', () => {
	// 		true.should.equal(false);
	// 	});
	// });

});
