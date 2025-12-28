import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('federation', () => {
	before((done) => getCredentials(done));

	describe('well-known', () => {
		describe('when matrix disabled', () => {
			before(async () => {
				await updateSetting('Federation_Service_Enabled', false, false);
				await updateSetting('Federation_Service_Domain', 'localhost', false);
			});

			after(async () => {
				await updateSetting('Federation_Service_Enabled', false, false);
			});

			it('should return 404 not found', async () => {
				await request.get('/.well-known/matrix/server').expect(403);
			});
		});

		describe('when enabled', () => {
			before(async () => {
				await updateSetting('Federation_Service_Enabled', true);
				await updateSetting('Federation_Service_Domain', 'rc.host');
			});

			after(async () => {
				await updateSetting('Federation_Service_Enabled', false);
				await updateSetting('Federation_Service_Domain', '');
			});

			it('should return matrix information', async () => {
				await request
					.get('/.well-known/matrix/server')
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('m.server', 'rc.host:443');
					});
			});
		});
	});
});
