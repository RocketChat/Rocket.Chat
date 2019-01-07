import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[EmojiCustom]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/emoji-custom]', () => {
		it('should return emojis', (done) => {
			request.get(api('emoji-custom'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.a('array');
				})
				.end(done);
		});
		it('should return emojis when use "query" query parameter', (done) => {
			request.get(api('emoji-custom?query={"_updatedAt": {"$gt": { "$date": "2018-11-27T13:52:01Z" } }}'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('emojis').and.to.be.a('array');
				})
				.end(done);
		});
	});
});
