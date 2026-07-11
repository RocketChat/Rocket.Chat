import { expect } from 'chai';
import { describe, it } from 'mocha';

import { sanitizeError, sanitizeSensitiveText } from '../../../../../ee/server/lib/calendarSync/logSanitizer';

describe('calendarSync/logSanitizer', () => {
	it('should scrub bearer tokens', () => {
		expect(sanitizeSensitiveText('failed with Authorization: Bearer eyJhbGciOi.abc-123_x')).to.not.include('eyJhbGciOi');
	});

	it('should scrub client_secret values from url-encoded bodies', () => {
		const result = sanitizeSensitiveText('request body client_secret=s3cr3t~value&grant_type=client_credentials');
		expect(result).to.include('client_secret=[redacted]');
		expect(result).to.not.include('s3cr3t~value');
	});

	it('should scrub SOAP password elements', () => {
		const result = sanitizeSensitiveText('<t:Password>hunter2</t:Password>');
		expect(result).to.not.include('hunter2');
	});

	it('should produce a code/message pair from CalendarSyncError-like objects', () => {
		const result = sanitizeError({ code: 'throttled', message: 'slow down Bearer abc.def' });
		expect(result.code).to.equal('throttled');
		expect(result.message).to.not.include('abc.def');
	});

	it('should handle non-object errors', () => {
		expect(sanitizeError('boom')).to.deep.equal({ code: 'unknown-error', message: 'boom' });
		expect(sanitizeError(undefined).code).to.equal('unknown-error');
	});
});
