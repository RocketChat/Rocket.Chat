import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';

const getHash = () =>
	request
		.get('/')
		.expect(200)
		.expect('Content-Type', 'text/html; charset=utf-8')
		.then((res) => {
			const hashMatch = res.text.match(/meteor_runtime_config\.js\?hash=([^"']+)/);
			expect(hashMatch).to.not.be.null;
			const hash = hashMatch![1];
			return hash;
		});

describe('[CORS]', () => {
	before((done) => getCredentials(done));
	after(async () => {
		await updateSetting('Site_Url', 'http://localhost:3000');
	});

	describe('[/meteor_runtime_config.js]', () => {
		it('should return 404 when hash is missing', (done) => {
			void request.get('/meteor_runtime_config.js').expect(404).end(done);
		});

		it('should return 404 when hash is invalid', (done) => {
			void request.get('/meteor_runtime_config.js').query({ hash: 'invalid_hash' }).expect(404).end(done);
		});

		it('should return runtime config when hash matches', async () => {
			// First get the root page to extract the hash
			const hash = await getHash();

			// Now request with the extracted hash
			await request
				.get('/meteor_runtime_config.js')
				.query({ hash })
				.expect(200)
				.expect('Content-Type', 'application/javascript; charset=UTF-8')
				.expect((res) => {
					expect(res.text).to.include('__meteor_runtime_config__');
					expect(res.text).to.include('http://localhost:3000');
				});
		});

		it('should return 404 when hash does not match', (done) => {
			// First get the root page to extract the hash
			void request.get('/meteor_runtime_config.js').query({ hash: 'invalidHash' }).expect(404).end(done);
		});

		it('should update hash when ROOT_URL changes', async () => {
			const originalHash = getHash();
			await updateSetting('Site_Url', 'http://new-url:3000');
			const newHash = await getHash();
			expect(newHash).to.not.equal(originalHash);
			// it should return if the new hash is valid
			await request
				.get('/meteor_runtime_config.js')
				.query({ hash: newHash })
				.expect(200)
				.expect('Content-Type', 'application/javascript; charset=UTF-8')
				.expect((res) => {
					expect(res.text).to.include('__meteor_runtime_config__');
					expect(res.text).to.include('http://new-url:3000');
				});
		});
	});
});
