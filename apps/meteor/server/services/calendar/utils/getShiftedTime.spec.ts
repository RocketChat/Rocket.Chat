import { getShiftedTime } from './getShiftedTime';

describe('getShiftedTime', () => {
	it('should shift time by the specified number of minutes', () => {
		const initialTime = new Date('2023-10-01T12:00:00Z');
		const shiftedTime = getShiftedTime(initialTime, 30);
		expect(shiftedTime).toEqual(new Date('2023-10-01T12:30:00Z'));
	});

	it('should handle negative shifts', () => {
		const initialTime = new Date('2023-10-01T12:00:00Z');
		const shiftedTime = getShiftedTime(initialTime, -15);
		expect(shiftedTime).toEqual(new Date('2023-10-01T11:45:00Z'));
	});

	it('should not modify the original date object', () => {
		const initialTime = new Date('2023-10-01T12:00:00Z');
		getShiftedTime(initialTime, 30);
		expect(initialTime).toEqual(new Date('2023-10-01T12:00:00Z'));
	});
});
