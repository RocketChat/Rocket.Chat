import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('Imports', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/getCurrentImportOperation]', () => {
		it('should return the current import operation', (done) => {
			request
				.get(api('getCurrentImportOperation'))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.true;
					expect(res.body.operation).not.be.null;
				})
				.end(done);
		});
		it('should return an error if params are not valid', (done) => {
			request
				.get(api('getCurrentImportOperation'))
				.set(credentials)
				.query({
					any: 'test',
				})
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.false;
				})
				.end(done);
		});
	});
});
