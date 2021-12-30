import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Video Conference]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('POST [/video-conference/jitsi.update-timeout]', () => {
		it('should return an error when call the endpoint without roomId required parameter', (done) => {
			request
				.post(api('video-conference/jitsi.update-timeout'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The "roomId" parameter is required!');
				})
				.end(done);
		});
		it('should return an error when call the endpoint withan invalid roomId', (done) => {
			request
				.post(api('video-conference/jitsi.update-timeout'))
				.set(credentials)
				.send({
					roomId: 'invalid-id',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Room does not exist!');
				})
				.end(done);
		});
		it('should return success when parameters are correct', (done) => {
			request
				.post(api('video-conference/jitsi.update-timeout'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('jitsiTimeout');
				})
				.end(done);
		});
	});
});
