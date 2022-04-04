import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - office hours', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/office-hours', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-business-hours', []).then(() => {
				request
					.get(api('livechat/office-hours'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(done);
			});
		});
		it('should return an array of office hours', (done) => {
			updatePermission('view-livechat-business-hours', ['admin']).then(() => {
				request
					.get(api('livechat/office-hours'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('officeHours');
						expect(res.body.officeHours).to.be.an('array');
					})
					.end(done);
			});
		});
	});
});
