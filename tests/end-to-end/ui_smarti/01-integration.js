/* eslint-env mocha */

import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

const topicName = 'smarti-test-topic';
const topicExpert = 'rocketchat.internal.admin.test';
const shortTopicMessage = 'Das ist das neue Thema zu dem Anfragen erstellt werden und die Wissensbasis genutzt wird!';
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
				sideNav.openChannel(topicName);
			} catch (e) {
				assistify.createTopic(topicName, topicExpert);
			}

		});

		describe('Message', () => {
			it('it should send a message', () => {
				assistify.clickKnowledgebase();
				assistify.sendTopicMessage(shortTopicMessage);
			});
		});
	});

	describe('[Request]', () => {

		describe('First request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, message);
			});
			it.skip('answer request', () => {
				assistify.sendTopicMessage(answer);
			});
			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest(comment);

			});
		});
		describe('Second request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, message);
				assistify.clickKnowledgebase();
			});

			it('knowledgebase answer visible', () => {
				assistify.clickKnowledgebase();
				assistify.knowledgebaseContent.waitForVisible(5000);
			});

			it('post knowledgebase answer', () => {
				assistify.knowledgebasePickAnswer.waitForVisible(5000);
				assistify.knowledgebasePickAnswer.click();
			});
			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest(comment);
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
