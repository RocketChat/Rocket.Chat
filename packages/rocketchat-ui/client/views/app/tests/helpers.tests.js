/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';
import { timeAgo } from '../helpers';


describe('Helpers', () => {
	describe('timeAgo', () => {
		it('returns formated time when the passed value is on the same day', () => {
			const now = new Date('Mon Aug 06 2018 22:00:00');

			const t1 = new Date('Mon Aug 06 2018 01:00:00');
			const t2 = new Date('Mon Aug 06 2018 10:00:10');
			const t3 = new Date('Mon Aug 06 2018 14:30:10');

			const func = (a) => a;

			assert.equal(timeAgo(t1, func, now), '1:00 AM');
			assert.equal(timeAgo(t2, func, now), '10:00 AM');
			assert.equal(timeAgo(t3, func, now), '2:30 PM');
		});

		it('returns "yesterday" when the passed value is on the day before', () => {
			const now = new Date('Tue Jul 03 2018 23:00:00');

			const t1 = new Date('Tue Jul 02 2018 23:59:00');
			const t2 = new Date('Tue Jul 02 2018 22:30:00');
			const t3 = new Date('Tue Jul 02 2018 01:00:00');

			const func = (a) => a;

			assert.equal(timeAgo(t1, func, now), 'yesterday');
			assert.equal(timeAgo(t2, func, now), 'yesterday');
			assert.equal(timeAgo(t3, func, now), 'yesterday');
		});

		it('returns formated date when the passed value two or more days before', () => {
			const now = new Date('Wed Jun 20 2018 00:00:01');

			const t1 = new Date('Mon Jun 18 2018 10:00:00');
			const t2 = new Date('Sun Jun 10 2018 00:00:00');
			const t3 = new Date('Thu May 10 2018 00:00:00');
			const t4 = new Date('Sun May 20 2018 00:00:01');
			const t5 = new Date('Fri Nov 10 2017 00:00:00');

			const func = () => 'should not be called';

			assert.equal(timeAgo(t1, func, now), 'Jun 18, 2018');
			assert.equal(timeAgo(t2, func, now), 'Jun 10, 2018');
			assert.equal(timeAgo(t3, func, now), 'May 10, 2018');
			assert.equal(timeAgo(t4, func, now), 'May 20, 2018');
			assert.equal(timeAgo(t5, func, now), 'Nov 10, 2017');
		});
	});
});
