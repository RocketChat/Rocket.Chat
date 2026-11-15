import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('SAML', () => {
	before((done) => getCredentials(done));

	describe('[/saml.parseMetadata]', () => {
		after(() => updatePermission('test-admin-options', ['admin']));

		it('should fail without the test-admin-options permission', async () => {
			await updatePermission('test-admin-options', []);
			await request
				.post(api('saml.parseMetadata'))
				.set(credentials)
				.send({ url: 'https://example.com/metadata.xml' })
				.expect('Content-Type', 'application/json')
				.expect(403);
			await updatePermission('test-admin-options', ['admin']);
		});

		it('should reject a body without url', async () => {
			await request
				.post(api('saml.parseMetadata'))
				.set(credentials)
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should reject a URL blocked by SSRF protection', async () => {
			await request
				.post(api('saml.parseMetadata'))
				.set(credentials)
				.send({ url: 'http://169.254.169.254/latest/meta-data' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('SAML_Metadata_url_blocked');
				});
		});
	});
});
