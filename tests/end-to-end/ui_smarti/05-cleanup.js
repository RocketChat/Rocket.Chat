/* eslint-env mocha */

import supertest from 'supertest';
export const request = supertest.agent('http://localhost:8080');

export const credentials = {
	username: 'admin',
	password: 'admin'
};

describe('[Smarti Cleanup]', () => {
	let clientid;
	it('get Client Id', function(done) {
		request.get('/client')
			.auth(credentials['username'], credentials['password'])
			.expect(200)
			.expect(function(res) {
				clientid = res.body[0].id;
				clientid.should.not.equal(undefined);
			})
			.end(done);
	});

	it('delete client', function(done) {
		request.del(`/client/${ clientid }`)
			.expect(204)
			.end(done);
	});
});
