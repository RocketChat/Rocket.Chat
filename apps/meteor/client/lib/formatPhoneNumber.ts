import { parsePhoneNumber } from 'awesome-phonenumber';

/**
 * Formats a phone number string to international format.
 *
 * @param rawNumber - The raw phone number string to format
 * @param [defaultRegion='US'] - The default region (country code) to use for parsing
 * @returns The formatted phone number in international format if valid, or the original input if invalid
 */
export function formatPhoneNumber(rawNumber: string, defaultRegion = 'US') {
    try {
        const parsedNumber = parsePhoneNumber(rawNumber, { regionCode: defaultRegion });

        // awesome-phonenumber handles errors gracefully under the .valid boolean
        if (parsedNumber.valid && parsedNumber.number?.international) {
            return parsedNumber.number.international;
        }

        return rawNumber;
    } catch {
        // Fallback in case of highly unexpected runtime errors
        return rawNumber;
    }
}