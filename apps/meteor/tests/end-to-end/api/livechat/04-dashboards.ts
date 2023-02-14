/* eslint-env mocha */

import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - dashboards', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/analytics/dashboards/conversation-totalizers', () => {
		const expectedMetrics = [
			'Total_conversations',
			'Open_conversations',
			'On_Hold_conversations',
			'Total_messages',
			'Busiest_time',
			'Total_abandoned_chats',
			'Total_visitors',
		];
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/conversation-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an array of conversation totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/conversation-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.totalizers).to.be.an('array');
						(res.body.totalizers as { title: string; value: string }[]).forEach(
							(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
						);
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/productivity-totalizers', () => {
		const expectedMetrics = ['Avg_response_time', 'Avg_first_response_time', 'Avg_reaction_time', 'Avg_of_waiting_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/productivity-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an array of productivity totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/productivity-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.totalizers).to.be.an('array');
						(res.body.totalizers as { title: string; value: string }[]).forEach(
							(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
						);
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/chats-totalizers', () => {
		const expectedMetrics = ['Total_abandoned_chats', 'Avg_of_abandoned_chats', 'Avg_of_chat_duration_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/chats-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an array of chats totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/chats-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.totalizers).to.be.an('array');
						(res.body.totalizers as { title: string; value: string }[]).forEach(
							(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
						);
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/agents-productivity-totalizers', () => {
		const expectedMetrics = ['Busiest_time', 'Avg_of_available_service_time', 'Avg_of_service_time'];
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(
						api('livechat/analytics/dashboards/agents-productivity-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'),
					)
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an array of agents productivity totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(
						api('livechat/analytics/dashboards/agents-productivity-totalizers?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'),
					)
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.totalizers).to.be.an('array');
						(res.body.totalizers as { title: string; value: string }[]).forEach(
							(prop) => expect(expectedMetrics.includes(prop.title)).to.be.true,
						);
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/chats', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/chats?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an array of productivity totalizers', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/chats?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('open');
						expect(res.body).to.have.property('closed');
						expect(res.body).to.have.property('queued');
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/chats-per-agent', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/chats-per-agent?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an object with open and closed chats by agent', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/chats-per-agent?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/agents-status', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/agents-status'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an object with agents status metrics', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/agents-status'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('offline');
						expect(res.body).to.have.property('away');
						expect(res.body).to.have.property('busy');
						expect(res.body).to.have.property('available');
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/chats-per-department', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/chats-per-department?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an object with open and closed chats by department', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/chats-per-department?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
	});

	describe('livechat/analytics/dashboards/charts/timings', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', []).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/timings?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.end(done);
			});
		});
		it('should return an object with open and closed chats by department', (done) => {
			updatePermission('view-livechat-manager', ['admin']).then(() => {
				request
					.get(api('livechat/analytics/dashboards/charts/timings?start=2019-10-25T15:08:17.248Z&end=2019-12-08T15:08:17.248Z'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('response');
						expect(res.body).to.have.property('reaction');
						expect(res.body).to.have.property('chatDuration');
						expect(res.body.response).to.have.property('avg');
						expect(res.body.response).to.have.property('longest');
						expect(res.body.reaction).to.have.property('avg');
						expect(res.body.reaction).to.have.property('longest');
						expect(res.body.chatDuration).to.have.property('avg');
						expect(res.body.chatDuration).to.have.property('longest');
					})
					.end(done);
			});
		});
	});
});
