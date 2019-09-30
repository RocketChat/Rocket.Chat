import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - departments', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/department', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission ["view-livechat-departments", "view-l-room"]', (done) => {
			updatePermission('view-l-room', []).then(() => {
				updatePermission('view-livechat-departments', []).then(() => {
					request.get(api('livechat/department'))
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
		});
		it('should return an array of departments', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				updatePermission('view-livechat-departments', ['admin']).then(() => {
					request.get(api('livechat/department'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.departments).to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
							expect(res.body).to.have.property('count');
						})
						.end(done);
				});
			});
		});
	});
});
