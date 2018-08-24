/* eslint-env mocha */
/* globals expect */

import {getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[EmojiCustom]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('GET', () => {
		it('[/emoji-custom]', (done) => {
			request.get(api('emoji-custom'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.a('array');
				})
				.end(done);
		});
	});
});
