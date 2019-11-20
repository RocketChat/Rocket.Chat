import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - dashboards', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/analytics/dashboards/conversation-totalizers', () => {
		const expectedMetrics = ['Total_conversations', 'Open_conversations', 'Total_messages', 'Busiest_time', 'Total_abandoned_chats'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request.get(api('livechat/analytics/dashboards/conversation-totalizers'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should return an array of conversation totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.get(api('livechat/analytics/dashboards/conversation-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.totalizers).to.be.an('array');
							res.body.totalizers.forEach((prop) => expect(expectedMetrics.includes(prop.title)).to.be.true);
						})
						.end(done);
				});
		});
	});

	describe('livechat/analytics/dashboards/productivity-totalizers', () => {
		const expectedMetrics = ['Avg_response_time', 'Avg_first_response_time', 'Avg_reaction_time', 'Avg_of_abandoned_chats', 'Avg_of_service_time', 'Avg_of_waiting_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request.get(api('livechat/analytics/dashboards/productivity-totalizers'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('unauthorized');
					})
					.end(done);
			});
		});
		it('should return an array of productivity totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.get(api('livechat/analytics/dashboards/productivity-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.totalizers).to.be.an('array');
							res.body.totalizers.forEach((prop) => expect(expectedMetrics.includes(prop.title)).to.be.true);
						})
						.end(done);
				});
		});
	});
});
