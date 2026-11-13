import { toDialableNumber } from './toDialableNumber';

describe('toDialableNumber', () => {
	it('dials the E.164 form when the server resolved one', () => {
		expect(toDialableNumber({ raw: '+49 (176) 10848201', e164: '+4917610848201' })).toBe('+4917610848201');
	});

	it.each([
		['+49 17610848201', '+4917610848201'],
		['+49 (176) 108-482.01', '+4917610848201'],
		['(040) 123 456', '040123456'],
		['0049/40/123456', '004940123456'],
		['＋４９ ４０ １２３４５６', '+4940123456'],
		['*21# ', '*21#'],
		['+49 40 +123', '+4940123'],
	])('strips the formatting from %p when there is no E.164 form', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it('falls back to raw when the E.164 form is empty', () => {
		expect(toDialableNumber({ raw: '+49 40 123456', e164: '' })).toBe('+4940123456');
	});
});
