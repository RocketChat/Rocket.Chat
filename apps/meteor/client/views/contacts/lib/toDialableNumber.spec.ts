import { toDialableNumber } from './toDialableNumber';

describe('toDialableNumber', () => {
	it('dials the E.164 form when the server resolved one', () => {
		expect(toDialableNumber({ raw: '+49 (176) 10848201', e164: '+4917610848201' })).toBe('+4917610848201');
	});

	it('dials the number in raw when there is no E.164 form', () => {
		expect(toDialableNumber({ raw: '+49 (0)40 123456 ext. 12' })).toBe('+4940123456');
	});

	it('dials the number in raw when the E.164 form is empty', () => {
		expect(toDialableNumber({ raw: '+49 40 123456', e164: '' })).toBe('+4940123456');
	});

	it('has no number to dial when raw holds none', () => {
		expect(toDialableNumber({ raw: 'n/a' })).toBeUndefined();
	});
});
