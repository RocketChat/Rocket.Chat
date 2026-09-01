import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';

describe('[SetupWizard]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/setupWizard.parameters]', () => {
		it('should return the wizard parameters without authentication', async () => {
			return request
				.get(api('setupWizard.parameters'))
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('serverAlreadyRegistered').that.is.a('boolean');
					expect(res.body).to.have.property('settings').that.is.an('array');
				});
		});

		it('should only return settings that belong to the wizard', async () => {
			return request
				.get(api('setupWizard.parameters'))
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.settings).to.not.be.empty;
					res.body.settings.forEach((setting: Record<string, unknown>) => {
						expect(setting).to.have.property('wizard');
						expect(setting).to.have.property('_id');
					});
				});
		});

		it('should return the wizard parameters when authenticated', async () => {
			return request
				.get(api('setupWizard.parameters'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('settings').that.is.an('array');
				});
		});
	});
});
