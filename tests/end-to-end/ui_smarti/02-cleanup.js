import supertest from 'supertest';
export const request = supertest.agent('http://localhost:8080');

describe('[Smarti Cleanup]', ()=> {
	var clientid;
	it('get Client Id', function(done){
		request.get('/client')
			.expect(200)
			.expect(function(res){
				clientid = res.body[0].id;
				expect(clientid).to.not.equal(undefined);
			})
			.end(done);
	});

	it('delete client', function(done){
		request.del('/client/'+clientid)
			.expect(200)
			.end(done);
	});
});
