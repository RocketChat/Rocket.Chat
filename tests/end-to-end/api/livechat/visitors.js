import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - visitors', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/visitors.pagesVisited', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request.get(api('livechat/visitors.pagesVisited?roomId=room-id'))
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
		it('should return an "error" when the roomId query param is not provided', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request.get(api('livechat/visitors.pagesVisited'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an array of pages', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request.get(api('livechat/visitors.pagesVisited?roomId=GENERAL'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.pages).to.be.an('array');
						})
						.end(done);
				});
		});
	});
});
