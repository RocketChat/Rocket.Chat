import { isForbiddenError } from './isForbiddenError';

describe('isForbiddenError', () => {
	it('should accept the body of a REST 403 refusal', () => {
		expect(isForbiddenError({ success: false, error: 'You are not allowed to do this', errorType: 'error-forbidden' })).toBe(true);
	});

	it.each([
		['the pre-403 teams.info refusal', { success: false, error: 'forbidden' }],
		['the pre-403 rooms.info refusal', { success: false, error: 'not-allowed' }],
		['another error type', { success: false, error: 'Room not found', errorType: 'error-room-not-found' }],
		['an Error instance', new Error('error-forbidden')],
		['a string', 'error-forbidden'],
		['null', null],
		['undefined', undefined],
	])('should reject %s', (_, error) => {
		expect(isForbiddenError(error)).toBe(false);
	});
});
