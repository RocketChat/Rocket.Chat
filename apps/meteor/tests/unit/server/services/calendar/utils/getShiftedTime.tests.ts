import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';

const { getShiftedTime } = proxyquire.noCallThru().load('../../../../../../server/services/calendar/utils/getShiftedTime', {});

describe('#getShiftedTime', () => {
	it('should shift time forward by minutes', () => {
		const date = new Date('2025-01-01T10:00:00Z');
		const result = getShiftedTime(date, 30);

		expect(result.getTime()).to.equal(new Date('2025-01-01T10:30:00Z').getTime());
		expect(date.getTime()).to.equal(new Date('2025-01-01T10:00:00Z').getTime());
	});

	it('should shift time backward by negative minutes', () => {
		const date = new Date('2025-01-01T10:00:00Z');
		const result = getShiftedTime(date, -15);

		expect(result.getTime()).to.equal(new Date('2025-01-01T09:45:00Z').getTime());
	});
});
