import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

import { formatPhoneNumber } from './formatPhoneNumber';

jest.mock('google-libphonenumber', () => {
	const mockFormat = jest.fn();
	const mockIsValidNumber = jest.fn();
	const mockParseAndKeepRawInput = jest.fn();

	return {
		PhoneNumberFormat: {
			INTERNATIONAL: 1,
		},
		PhoneNumberUtil: {
			getInstance: jest.fn().mockReturnValue({
				parseAndKeepRawInput: mockParseAndKeepRawInput,
				isValidNumber: mockIsValidNumber,
				format: mockFormat,
			}),
		},
	};
});

describe('formatPhoneNumber', () => {
	const phoneUtil = PhoneNumberUtil.getInstance() as unknown as {
		parseAndKeepRawInput: jest.Mock;
		isValidNumber: jest.Mock;
		format: jest.Mock;
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return an empty string when input is empty', () => {
		const rawNumber = '';
		phoneUtil.parseAndKeepRawInput.mockImplementationOnce(() => {
			throw new Error('Parsing error');
		});

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe('');
	});

	it('should format a valid phone number to international format', () => {
		const rawNumber = '1234567890';
		const parsedNumber = { mock: 'parsedNumber' };
		const formattedNumber = '+1 234 567 890';

		phoneUtil.parseAndKeepRawInput.mockReturnValueOnce(parsedNumber);
		phoneUtil.isValidNumber.mockReturnValueOnce(true);
		phoneUtil.format.mockReturnValueOnce(formattedNumber);

		const result = formatPhoneNumber(rawNumber);

		expect(phoneUtil.parseAndKeepRawInput).toHaveBeenCalledWith(rawNumber, 'US');
		expect(phoneUtil.isValidNumber).toHaveBeenCalledWith(parsedNumber);
		expect(phoneUtil.format).toHaveBeenCalledWith(parsedNumber, PhoneNumberFormat.INTERNATIONAL);
		expect(result).toBe(formattedNumber);
	});

	it('should use the provided default region', () => {
		const rawNumber = '1234567890';
		const region = 'GB';
		const parsedNumber = { mock: 'parsedNumber' };

		phoneUtil.parseAndKeepRawInput.mockReturnValueOnce(parsedNumber);
		phoneUtil.isValidNumber.mockReturnValueOnce(true);

		formatPhoneNumber(rawNumber, region);

		expect(phoneUtil.parseAndKeepRawInput).toHaveBeenCalledWith(rawNumber, region);
	});

	it('should return the raw input if the number is invalid', () => {
		const rawNumber = 'invalid-number';
		const parsedNumber = { mock: 'parsedNumber' };

		phoneUtil.parseAndKeepRawInput.mockReturnValueOnce(parsedNumber);
		phoneUtil.isValidNumber.mockReturnValueOnce(false);

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe(rawNumber);
		expect(phoneUtil.format).not.toHaveBeenCalled();
	});

	it('should return the raw input if parsing throws an error', () => {
		const rawNumber = 'error-number';

		phoneUtil.parseAndKeepRawInput.mockImplementationOnce(() => {
			throw new Error('Parsing error');
		});

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe(rawNumber);
		expect(phoneUtil.isValidNumber).not.toHaveBeenCalled();
		expect(phoneUtil.format).not.toHaveBeenCalled();
	});

	it('should format a valid Brazilian number when the region is provided', () => {
		const rawNumber = '11987654321';
		const region = 'BR';
		const parsedNumber = { mock: 'parsedNumber' };
		const formattedNumber = '+55 11 98765-4321';

		phoneUtil.parseAndKeepRawInput.mockReturnValueOnce(parsedNumber);
		phoneUtil.isValidNumber.mockReturnValueOnce(true);
		phoneUtil.format.mockReturnValueOnce(formattedNumber);

		const result = formatPhoneNumber(rawNumber, region);

		expect(phoneUtil.parseAndKeepRawInput).toHaveBeenCalledWith(rawNumber, region);
		expect(result).toBe(formattedNumber);
	});

	it('should handle a number already in international format', () => {
		const rawNumber = '+1 202-555-0173';
		const parsedNumber = { mock: 'parsedNumber' };
		const formattedNumber = '+1 202-555-0173';

		phoneUtil.parseAndKeepRawInput.mockReturnValueOnce(parsedNumber);
		phoneUtil.isValidNumber.mockReturnValueOnce(true);
		phoneUtil.format.mockReturnValueOnce(formattedNumber);

		const result = formatPhoneNumber(rawNumber);

		expect(result).toBe(formattedNumber);
	});
});
