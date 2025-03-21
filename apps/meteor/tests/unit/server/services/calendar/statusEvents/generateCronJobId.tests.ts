import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';

const { generateCronJobId } = proxyquire.noCallThru().load('../../../../../../server/services/calendar/statusEvents/generateCronJobId', {});

describe('#generateCronJobId', () => {
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';

	it('should generate correct ID for status events', () => {
		const id = generateCronJobId(fakeEventId, fakeUserId, 'status');
		expect(id).to.equal(`calendar-presence-status-${fakeEventId}-${fakeUserId}`);
	});

	it('should generate correct ID for reminder events', () => {
		const id = generateCronJobId(fakeEventId, fakeUserId, 'reminder');
		expect(id).to.equal(`calendar-reminder-${fakeEventId}-${fakeUserId}`);
	});

	it('should throw an error if some required parameters are missing', () => {
		expect(() => generateCronJobId(undefined, fakeUserId, 'status')).to.throw(
			'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
		);
		expect(() => generateCronJobId(fakeEventId, undefined, 'status')).to.throw(
			'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
		);
		expect(() => generateCronJobId(fakeEventId, fakeUserId)).to.throw(
			'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
		);
	});

	it('should throw an error if eventType is not "status" or "reminder"', () => {
		expect(() => generateCronJobId(fakeEventId, fakeUserId, 'invalid' as any)).to.throw(
			'Missing required parameters. Please provide eventId, uid and eventType (status or reminder)',
		);
	});
});
