import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';

const topicName = 'Smarti-test-topic4';
const topicExpert = 'rocketchat.internal.admin.test';
const smartiResult = 'http://localhost:3000/api/v1/smarti.result/key123';
const message = 'Mit allgemeinen Anfragen verschaffen Sie sich einen Überblick über den Markt, indem Sie Produkte, Preise und Bestellbedingungen unterschiedlicher Lieferanten und Dienstleister kennen lernen. In einem allgemeinen Anfragebrief bitten Sie zum die Zusendung von Katalogen, Prospekten, Preislisten und Produktmustern. Wie kann ich dieses Wissen nutzen?';
const answer = 'Das ist die Antwort auf diese Anfrage!';
const comment = 'Anfrage wurde erfolgreich beantwortet';

const smarti_user = 'smarti';
const smarti_email = 'smarti@test.com';
const smarti_pass = 'smarti';

import supertest from 'supertest';
export const request = supertest.agent('http://localhost:3000');

import {checkIfUserIsAdmin} from '../../data/checks';


describe('[Smarti Integration]', ()=> {

	before(()=>{
		checkIfUserIsAdmin(smarti_user, smarti_email, smarti_pass); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Topic]', ()=> {
		before(()=> {
			try {
				// sideNav.getChannelFromSpotlight(topicName).click();
				assistify.createTopic(topicName, topicExpert);
			}
			catch(e){
				// assistify.createTopic(topicName, topicExpert);
			};
		});

		describe('New Topic', ()=> {
			it('it should send a message', () => {
				mainContent.sendMessage(message);
			});

			it('close new Topic', ()=> {
				assistify.closeTopic();
			})
		});
	});

	describe('[Request]', ()=> {

		describe('First request', ()=> {
			var request1 = topicName+'-1';

			it('create is successful', ()=> {
				assistify.createHelpRequest(topicName, message);
			});
			it('answer request', ()=> {
				assistify.answerRequest(request1, answer);
			});
			it('close request', ()=> {
				assistify.closeRequest(request1, comment);
			});
		});
		describe('Second request', ()=> {
			var request2 = topicName+'-2';

			it('create is successful', ()=> {
				assistify.createHelpRequest(topicName, message);
			});

			it('knowledgebase answer visible', ()=> {
				assistify.knowledgebaseAnswer.waitForVisible(5000);
			});

			it('post knowledgebase answer', ()=> {
				assistify.knowledgebasePostBtn.waitForVisible(5000);
				assistify.knowledgebasePostBtn.click();
			});
		});
	});

	describe('[BREAK]', ()=> {
		it('BREAK', ()=> {
			true.should.equal(false);
		});
	});

});
