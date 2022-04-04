import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - messages', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/messages.external', () => {
		it('should return an array of messages', (done) => {
			request
				.get(api('livechat/messages.external/roomId'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});
});
