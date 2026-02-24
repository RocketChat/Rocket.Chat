import { parsePhoneNumber } from 'awesome-phonenumber';

import { formatPhoneNumber } from './formatPhoneNumber';

jest.mock('awesome-phonenumber', () => ({
	parsePhoneNumber: jest.fn(),
}));

describe('formatPhoneNumber', () => {
	const mockedParsePhoneNumber = parsePhoneNumber as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return an empty string when input is empty', () => {
		const rawNumber = '';
		mockedParsePhoneNumber.mockReturnValueOnce({ valid: false });

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe('');
	});

	it('should format a valid phone number to international format', () => {
		const rawNumber = '1234567890';
		const formattedNumber = '+1 234 567 890';

		mockedParsePhoneNumber.mockReturnValueOnce({
			valid: true,
			number: { international: formattedNumber },
		});

		const result = formatPhoneNumber(rawNumber);

		expect(mockedParsePhoneNumber).toHaveBeenCalledWith(rawNumber, { regionCode: 'US' });
		expect(result).toBe(formattedNumber);
	});

	it('should use the provided default region', () => {
		const rawNumber = '1234567890';
		const region = 'GB';

		mockedParsePhoneNumber.mockReturnValueOnce({ valid: false });

		formatPhoneNumber(rawNumber, region);

		expect(mockedParsePhoneNumber).toHaveBeenCalledWith(rawNumber, { regionCode: region });
	});

	it('should return the raw input if the number is invalid', () => {
		const rawNumber = 'invalid-number';

		mockedParsePhoneNumber.mockReturnValueOnce({ valid: false });

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe(rawNumber);
	});

	it('should return the raw input if parsing throws an error', () => {
		const rawNumber = 'error-number';

		mockedParsePhoneNumber.mockImplementationOnce(() => {
			throw new Error('Parsing error');
		});

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe(rawNumber);
	});

	it('should format a valid Brazilian number when the region is provided', () => {
		const rawNumber = '11987654321';
		const region = 'BR';
		const formattedNumber = '+55 11 98765-4321';

		mockedParsePhoneNumber.mockReturnValueOnce({
			valid: true,
			number: { international: formattedNumber },
		});

		const result = formatPhoneNumber(rawNumber, region);

		expect(mockedParsePhoneNumber).toHaveBeenCalledWith(rawNumber, { regionCode: region });
		expect(result).toBe(formattedNumber);
	});

	it('should handle a number already in international format', () => {
		const rawNumber = '+1 202-555-0173';
		const formattedNumber = '+1 202-555-0173';

		mockedParsePhoneNumber.mockReturnValueOnce({
			valid: true,
			number: { international: formattedNumber },
		});

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe(formattedNumber);
	});
});