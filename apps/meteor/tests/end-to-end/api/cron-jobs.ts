import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('[Cron Jobs API]', () => {
	before((done) => getCredentials(done));

	after(async () => {
		await updatePermission('manage-scheduled-jobs', ['admin']);
	});

	describe('[/cron.jobs]', () => {
		it('should return 401 when the user is not authenticated', async () => {
			await request.get(api('cron.jobs')).expect(401);
		});

		it('should return a 403 error when the user does not have the manage-scheduled-jobs permission', async () => {
			await updatePermission('manage-scheduled-jobs', []);
			await request
				.get(api('cron.jobs'))
				.set(credentials)
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-unauthorized');
				});
		});

		it('should return an array of core jobs when the user has the permission', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.get(api('cron.jobs'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('jobs').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});

		it('should return paginated core jobs when requested with count and offset params', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.get(api('cron.jobs'))
				.set(credentials)
				.query({ count: 5, offset: 0 })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('jobs').and.to.be.an('array');
					expect(res.body.offset).to.equal(0);
				});
		});
	});

	describe('[/cron.appjobs]', () => {
		it('should return 401 when the user is not authenticated', async () => {
			await request.get(api('cron.appjobs')).expect(401);
		});

		it('should return a 403 error when the user does not have the manage-scheduled-jobs permission', async () => {
			await updatePermission('manage-scheduled-jobs', []);
			await request.get(api('cron.appjobs')).set(credentials).expect(403);
		});

		it('should return an array of app jobs when the user has the permission', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.get(api('cron.appjobs'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('jobs').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('[/cron.history]', () => {
		it('should return 401 when the user is not authenticated', async () => {
			await request.get(api('cron.history')).expect(401);
		});

		it('should return a 403 error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-scheduled-jobs', []);
			await request.get(api('cron.history')).set(credentials).query({ jobName: 'NPS' }).expect(403);
		});

		it('should return an array of recent history when permission is granted', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.get(api('cron.history'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});

		it('should return an array with the history logs when permission is granted and jobName is provided', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.get(api('cron.history'))
				.set(credentials)
				.query({ jobName: 'NPS' })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('history').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('[/cron.trigger]', () => {
		it('should return 401 when the user is not authenticated', async () => {
			await request.post(api('cron.trigger')).send({ jobName: 'test' }).expect(401);
		});

		it('should return a 403 error when missing permission', async () => {
			await updatePermission('manage-scheduled-jobs', []);
			await request.post(api('cron.trigger')).set(credentials).send({ jobName: 'invalid-job' }).expect(403);
		});

		it('should return a 400 invalid-params error when jobName is missing in the body', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.post(api('cron.trigger'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should return error-job-not-found when trying to trigger a non-existent job', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.post(api('cron.trigger'))
				.set(credentials)
				.send({ jobName: 'invalid-job' })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('error-job-not-found');
				});
		});
	});

	describe('[/cron.enable]', () => {
		it('should return 401 when the user is not authenticated', async () => {
			await request.post(api('cron.enable')).send({ jobName: 'test' }).expect(401);
		});

		it('should return a 403 error when missing permission', async () => {
			await updatePermission('manage-scheduled-jobs', []);
			await request.post(api('cron.enable')).set(credentials).send({ jobName: 'invalid-job' }).expect(403);
		});

		it('should return error-job-not-found when trying to enable a non-existent job', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.post(api('cron.enable'))
				.set(credentials)
				.send({ jobName: 'invalid-job' })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('error-job-not-found');
				});
		});
	});

	describe('[/cron.disable]', () => {
		it('should return 401 when the user is not authenticated', async () => {
			await request.post(api('cron.disable')).send({ jobName: 'test' }).expect(401);
		});

		it('should return a 403 error when missing permission', async () => {
			await updatePermission('manage-scheduled-jobs', []);
			await request.post(api('cron.disable')).set(credentials).send({ jobName: 'invalid-job' }).expect(403);
		});

		it('should return error-job-not-found when trying to disable a non-existent job', async () => {
			await updatePermission('manage-scheduled-jobs', ['admin']);
			await request
				.post(api('cron.disable'))
				.set(credentials)
				.send({ jobName: 'invalid-job' })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.equal('error-job-not-found');
				});
		});
	});
});
