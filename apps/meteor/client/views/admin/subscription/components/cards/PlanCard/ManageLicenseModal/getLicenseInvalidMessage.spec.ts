import type { BehaviorWithContext } from '@rocket.chat/core-typings';

import { getLicenseInvalidMessage } from './getLicenseInvalidMessage';

const reason = (behavior: string, reason: string) => ({ behavior, reason }) as BehaviorWithContext;

it('should treat an empty reason list as an undecodable license', () => {
	expect(getLicenseInvalidMessage([])).toBe('License_error_format_invalid');
});

it('should map an invalidate_license/url reason to a workspace URL mismatch', () => {
	expect(getLicenseInvalidMessage([reason('invalidate_license', 'url')])).toBe('License_error_url_mismatch');
});

it('should map an invalidate_license/period reason to an expired license', () => {
	expect(getLicenseInvalidMessage([reason('invalidate_license', 'period')])).toBe('License_error_expired');
});

it('should map a prevent_installation/period reason to an out-of-date-range license', () => {
	expect(getLicenseInvalidMessage([reason('prevent_installation', 'period')])).toBe('License_error_outside_date_range');
});

it('should map a limit reason from either behavior to exceeded limits', () => {
	expect(getLicenseInvalidMessage([reason('invalidate_license', 'limit')])).toBe('License_error_limits_exceeded');
	expect(getLicenseInvalidMessage([reason('prevent_installation', 'limit')])).toBe('License_error_limits_exceeded');
});

it('should prioritize a URL mismatch over other reasons', () => {
	expect(getLicenseInvalidMessage([reason('invalidate_license', 'period'), reason('invalidate_license', 'url')])).toBe(
		'License_error_url_mismatch',
	);
});

it('should fall back to a generic message for unrecognized reasons', () => {
	expect(getLicenseInvalidMessage([reason('invalidate_license', 'something_new')])).toBe('License_error_generic');
});
