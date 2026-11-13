import { toDialableNumber } from './toDialableNumber';

const leftToRightEmbedding = String.fromCodePoint(0x202a);
const popDirectionalFormatting = String.fromCodePoint(0x202c);
const leftToRightMark = String.fromCodePoint(0x200e);
const zeroWidthSpace = String.fromCodePoint(0x200b);
const noBreakSpace = String.fromCodePoint(0xa0);

describe('toDialableNumber', () => {
	it('dials the E.164 form when the server resolved one', () => {
		expect(toDialableNumber({ raw: '+49 (176) 10848201', e164: '+4917610848201' })).toBe('+4917610848201');
	});

	it('falls back to raw when the E.164 form is empty', () => {
		expect(toDialableNumber({ raw: '+49 40 123456', e164: '' })).toBe('+4940123456');
	});

	it.each([
		['+49 17610848201', '+4917610848201'],
		['+49 (176) 108-482.01', '+4917610848201'],
		['(+49) 176 10848201', '+4917610848201'],
		[`+49${noBreakSpace}40${noBreakSpace}123456`, '+4940123456'],
		[`${leftToRightEmbedding}+49 40 123456${popDirectionalFormatting}`, '+4940123456'],
		[`${leftToRightMark}+49 40 123${zeroWidthSpace}456`, '+4940123456'],
		['(040) 123 456', '040123456'],
		['040 / 123 456', '040123456'],
		['0049/40/123456', '004940123456'],
		['Tel: +49 40 123456', '+4940123456'],
		['＋４９ ４０ １２３４５６', '+4940123456'],
		['*21# ', '*21#'],
		['*21*0301234567#', '*21*0301234567#'],
	])('strips the formatting from %j when there is no E.164 form', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it.each([
		['+49 (0)40 123456', '+4940123456'],
		['+49 (0) 40 / 123 456-78', '+494012345678'],
		['+44 (0)20 7123 4567', '+442071234567'],
		['0049 (0)40 123456', '004940123456'],
		['Tel: +49 (0)40 123456', '+4940123456'],
	])('drops the (0) trunk prefix after a country code in %j', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it.each([
		['(040) 123456', '040123456'],
		['(0) 40 123456', '040123456'],
		['+49 40 123(0)456', '+49401230456'],
		['+49 40 (0)123456', '+49400123456'],
	])('keeps a zero in parentheses that is not a trunk prefix after a country code in %j', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it.each([
		['+49 40 123 0(456)', '+49401230456'],
		['+49 40 123456-0', '+49401234560'],
	])('keeps the digits of %j in the order they were written', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it.each([
		['+1 800 555 0199 ext. 23', '+18005550199'],
		['+1 800 555 0199 ext 23', '+18005550199'],
		['+1 800 555 0199 extension: 23', '+18005550199'],
		['+1 800 555 0199 x23', '+18005550199'],
		['+1 800 555 0199 X 23', '+18005550199'],
		['+1 (800) 555-0199 x123', '+18005550199'],
		['+1 800 555 0199;ext=23', '+18005550199'],
		['030 123 456 ext. 12', '030123456'],
		['+4930123456,,12', '+4930123456'],
		['+49 30 123456, 0171 987', '+4930123456'],
	])('dials the main line of %j', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it.each([
		['Fax 040 123456', '040123456'],
		['Text 040 123456', '040123456'],
	])('does not read the letters of a word in %j as an extension', (raw, expected) => {
		expect(toDialableNumber({ raw })).toBe(expected);
	});

	it('keeps only one leading plus sign', () => {
		expect(toDialableNumber({ raw: '+49 +40 123' })).toBe('+4940123');
	});

	it.each([
		['no number at all', 'n/a'],
		['only words', 'not a number'],
		['only formatting', ' - '],
		['only invisible characters', `${leftToRightEmbedding}${popDirectionalFormatting}`],
		['only a prefix', '+'],
		['no characters', ''],
		['digits the dialer cannot type', '٠١٢٣٤٥٦'],
	])('has no number to dial for a phone with %s', (_case, raw) => {
		expect(toDialableNumber({ raw })).toBeUndefined();
	});
});
