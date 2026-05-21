import { parseDiversionHeader } from './parseDiversionHeader';

describe('parseDiversionHeader', () => {
	describe('unquoted display name', () => {
		it('parses a single-word unquoted display name', () => {
			expect(parseDiversionHeader('Alice <sip:1234@pbx.example.com>;reason=unconditional')).toEqual({
				extension: '1234',
				displayName: 'Alice',
			});
		});

		it('parses a multi-word unquoted display name', () => {
			expect(parseDiversionHeader('Alice Smith <sip:1234@pbx.example.com>')).toEqual({
				extension: '1234',
				displayName: 'Alice Smith',
			});
		});
	});

	describe('quoted display name', () => {
		it('parses a single-word quoted display name', () => {
			expect(parseDiversionHeader('"Alice" <sip:1234@pbx.example.com>;reason=unconditional')).toEqual({
				extension: '1234',
				displayName: 'Alice',
			});
		});

		it('parses a multi-word quoted display name', () => {
			expect(parseDiversionHeader('"Alice Smith" <sip:1234@pbx.example.com>')).toEqual({
				extension: '1234',
				displayName: 'Alice Smith',
			});
		});

		it('returns undefined displayName for an empty quoted string', () => {
			expect(parseDiversionHeader('"" <sip:1234@pbx.example.com>')).toEqual({
				extension: '1234',
				displayName: undefined,
			});
		});
	});

	describe('no display name', () => {
		it('parses the bare angle-bracket form', () => {
			expect(parseDiversionHeader('<sip:1234@pbx.example.com>;reason=unconditional')).toEqual({
				extension: '1234',
				displayName: undefined,
			});
		});
	});

	describe('URI variants', () => {
		it('parses a sips: URI', () => {
			expect(parseDiversionHeader('<sips:5678@pbx.example.com>')).toEqual({
				extension: '5678',
				displayName: undefined,
			});
		});

		it('handles URI parameters after the host', () => {
			expect(parseDiversionHeader('<sip:1234@pbx.example.com;transport=tcp>;reason=unconditional')).toEqual({
				extension: '1234',
				displayName: undefined,
			});
		});
	});

	describe('whitespace handling', () => {
		it('trims leading and trailing whitespace from the raw value', () => {
			expect(parseDiversionHeader('  <sip:9000@pbx.example.com>  ')).toEqual({
				extension: '9000',
				displayName: undefined,
			});
		});

		it('trims extra whitespace between an unquoted display name and the angle bracket', () => {
			expect(parseDiversionHeader('Alice   <sip:1234@pbx.example.com>')).toEqual({
				extension: '1234',
				displayName: 'Alice',
			});
		});
	});

	describe('invalid inputs', () => {
		it('returns null for a bare addr-spec without angle brackets (not valid per RFC 5806)', () => {
			expect(parseDiversionHeader('sip:1234@pbx.example.com')).toBeNull();
		});

		it('returns null for a URI with no user part', () => {
			expect(parseDiversionHeader('<sip:pbx.example.com>')).toBeNull();
		});

		it('returns null for a non-SIP URI inside brackets', () => {
			expect(parseDiversionHeader('<tel:+1234567890>')).toBeNull();
		});

		it('returns null for an empty string', () => {
			expect(parseDiversionHeader('')).toBeNull();
		});

		it('returns null for a non-string value', () => {
			expect(parseDiversionHeader(null as unknown as string)).toBeNull();
		});
	});
});
