import { expect } from 'chai';

import { buildHistoryQuery } from '../../../../../server/services/cron-jobs/buildHistoryQuery';

describe('CronJobs buildHistoryQuery', () => {
	it('should filter by job name when one is provided', () => {
		expect(buildHistoryQuery('NPS', ['NPS', 'cleanup'])).to.deep.equal({ name: 'NPS' });
	});

	it('should return failed runs and history for jobs that are no longer active', () => {
		expect(buildHistoryQuery(undefined, ['recurring-job'])).to.deep.equal({
			$or: [{ error: { $exists: true, $nin: [null, ''] } }, { name: { $nin: ['recurring-job'] } }],
		});
	});
});
