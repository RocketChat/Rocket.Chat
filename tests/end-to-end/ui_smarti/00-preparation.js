/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import supertest from 'supertest';
export const request = supertest.agent('http://localhost:8080');
export const credentials = {
	username: 'admin',
	password: 'admin'
};
const clientconfig = '{"queryBuilder":[{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationmlt","displayName":"conversationmlt","type":"conversationmlt","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]},{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationsearch","displayName":"conversationsearch","type":"conversationsearch","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]}]}';

describe('[Smarti Connection]', ()=>{

	describe('[Status]', function() {
		describe('health', ()=> {
			it('Smarti should be UP', (done) => {
				request.get('/system/health')
					.expect(200)
					.expect('Content-Type', 'application/vnd.spring-boot.actuator.v1+json;charset=UTF-8')
					.expect((res) => {
						expect(res.body).to.have.property('status', 'UP');
					})
					.end(done);
			});
		});
		describe('Info', ()=> {
			it('Access Smarti info', (done)=> {
				request.get('/system/info')
					.expect(200)
					.expect('Content-Type', 'application/vnd.spring-boot.actuator.v1+json;charset=UTF-8')
					.end(done);
			});
		});
	});

	// describe('[]', function() {
	// 	describe('client', ()=> {
	// 		var response;
	// 		it('create new client', function(done) {
	// 			response = request.post('/client')
	// 				.send({
	// 					defaultClient: true,
	// 					description: "",
	// 					name: "testclient"
	// 				})
	// 				.set('Accept', 'application/json')
	// 				.expect(200)
	// 				.end(function (err, res) {
	// 					var clientid = res.body.id
	// 					console.log(clientid)
	// 					request.post(`/client/${clientid}config`)
	// 						.send({
	// 							jsonData: clientconfig
	// 						})
	// 						.set('Accept', 'text/plain')
	// 						.expect(200)
	// 						.end(done);
	// 					done();
	// 				});
	// 		});
	// 	});
	// });

	// describe.skip('[Conversation]', ()=> {
	// 	it('Get Conversation', (done)=> {
	// 		request.get('/conversation/59f1d5e8857aba0006307ef2')
	// 			.expect(200)
	// 			.end(done);
	// 	});
	// 	it('Get Analysis', (done)=> {
	// 		request.get('/conversation/59f1d5e8857aba0006307ef2/analysis')
	// 			.expect(200)
	// 			.end(done);
	// 	});
	// });
    //
	// describe('[Rocket.Chat]', ()=> {
	// 	it('Get client list', (done)=> {
	// 		request.get('/client')
	// 			.auth(credentials['username'], credentials['password'])
	// 			.expect(200)
	// 			.expect('Content-Type', 'application/json;charset=UTF-8')
	// 			.end(done);
	// 	});
	// });
    //
	describe.skip('[BREAK]', ()=> {
		it('BREAK', ()=> {
			true.should.equal(false);
		});
	});

});




// -------- Ui tests --------

// import admin from '../../pageobjects/administration.page';
// import sideNav from '../../pageobjects/side-nav.page';
// import {knowledgebase, knowledgebaseDomain, knowledgebaseInputToken, knowledgebaseURL} from '../../data/assistify_configdata';
// import assistify from '../../pageobjects/assistify.page';
// import {checkIfUserIsAdmin} from '../../data/checks';
// import {adminUsername, adminEmail, adminPassword} from '../../data/user.js';

// describe('[Connection]', ()=>{
// 	before(() => {
// 		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
// 	});
// 	describe('[Settings', () => {
// 		before(() => {
// 			sideNav.accountMenu.click();
// 			sideNav.admin.waitForVisible(5000);
// 			sideNav.admin.click();
// 			admin.flexNavContent.waitForVisible(5000);
// 		});
// 		describe('[Assistify]', ()=> {
// 			before(() => {
// 				assistify.assistifyLink.waitForVisible(5000);
// 				assistify.assistifyLink.click();
// 				assistify.assistifyKnowledgebaseExpand.waitForVisible(5000);
// 				assistify.assistifyKnowledgebaseExpand.click();
// 			});
// 			it('KnowledgebaseInfo should be visible', () => {
// 				assistify.assistifyKnowledgebaseURL.waitForVisible(5000);
// 				// assistify.assistifyKnowledgebaseName.isVisible.should.be.true;
// 				assistify.assistifyKnowledgebaseURL.isVisible.should.be.true;
// 				// assistify.assistifyKnowledgebaseToken.isVisible.should.be.true;
// 				// assistify.assistifyKnowledgebaseDomain.isVisible.should.be.true;
// 				// assistify.assistifyKnowledgebaseActiveTrue.isVisible.should.be.true;
// 				// assistify.assistifyKnowledgebaseActiveFalse.isVisible.should.be.true;
// 			});
// 			it('Knowledgebase can get activation is clickable', ()=>{
// 				assistify.assistifyKnowledgebaseActiveTrue.click();
// 				assistify.assistifyKnowledgebaseActiveFalse.click();
// 			});
// 			it.skip('Knowledgebase Name is set', ()=> {
// 				assistify.assistifyKnowledgebaseName.should.equal(knowledgebase);
// 			});
// 			it.skip('Knowledgebase URL is set', ()=> {
// 				assistify.assistifyKnowledgebaseURL.should.equal(knowledgebaseURL);
// 			});
// 			it.skip('Knowledgebase Input Token is set', ()=> {
// 				assistify.assistifyKnowledgebaseToken.should.equal(knowledgebaseInputToken);
// 			});
// 			it.skip('Knowledgebase Domain is set', ()=> {
// 				assistify.assistifyKnowledgebaseDomain.should.equal(knowledgebaseDomain);
// 			});
// 		});
// 	});
// 	describe.skip('[Smarti Connected]', ()=> {
// 		//
// 	});
// });
