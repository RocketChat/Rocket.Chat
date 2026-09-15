import type { ISetting } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { getSettingValueById, updateSetting } from '../../data/permissions.helper';

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

		describe('when the setup wizard is already completed', () => {
			let previousState: ISetting['value'];

			before(async () => {
				previousState = await getSettingValueById('Show_Setup_Wizard');
				await updateSetting('Show_Setup_Wizard', 'completed');
			});

			after(async () => updateSetting('Show_Setup_Wizard', previousState));

			it('should not expose the wizard parameters to unauthenticated requests', async () => {
				return request
					.get(api('setupWizard.parameters'))
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.not.have.property('settings');
						expect(res.body).to.not.have.property('serverAlreadyRegistered');
					});
			});

			it('should not expose the wizard parameters to authenticated requests', async () => {
				return request
					.get(api('setupWizard.parameters'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.not.have.property('settings');
					});
			});
		});
	});
});
