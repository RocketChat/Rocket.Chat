/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import supertest from 'supertest';
export const request = supertest.agent('http://localhost:8080');
export const credentials = {
	username: 'admin',
	password: 'admin'
};
const clientconfig = '{"queryBuilder":[{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationmlt","displayName":"conversationmlt","type":"conversationmlt","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]},{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationsearch","displayName":"conversationsearch","type":"conversationsearch","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]}]}';
debugger;
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

	describe('[]', function() {
		describe('client', ()=> {
			var clientid;

			it('create new client', (done)=>{
				request.post('/client')
					.send({
						defaultClient: true,
						description: "",
						name: "testclient"
					})
					.set('Accept', 'application/json')
					.end(function(err, res){
						clientid = res.body.id;
						expect(res.status).to.be.equal(200);
						console.log('clientid',res.body.id);
						done();
					});
			});

			it ('get client id', function(done) {
				request.get('/client')
					.expect(200)
					.expect(function(res){
						expect(res.body[0].id, clientid)
						expect(clientid).to.not.equal(undefined);
					})
					.end(done);
			});

			it('post query-builder', function(done) {
				let code = '/client/'+clientid+'/config';
				console.log('config post',code);
				request.post(code)
					.set('Content-Type', 'application/json')
					.send(clientconfig)
					.expect(200)
					.end(function(err, res){
						console.log('post config',res.body);
						done();
					});
			});
		});
	});

	describe.skip('[BREAK]', ()=> {
		it('BREAK', ()=> {
			true.should.equal(false);
		});
	});

});
