import { REDACTED, scrubForLog, scrubText } from './scrub';

describe('scrubText', () => {
	describe('authorization schemes', () => {
		const bearerToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.payload.signature';
		const ntlmToken = 'TlRMTVNTUAADAAAAGAAYAIgAAAAY';
		const basicToken = 'Q09SUFxzdmMtcmM6c2VjcmV0';
		const negotiateToken = 'YIIJvwYGKwYBBQUCoIIJszCC';

		it.each([
			[`Bearer ${bearerToken}`, 'Bearer', bearerToken],
			[`NTLM ${ntlmToken}`, 'NTLM', ntlmToken],
			[`Basic ${basicToken}`, 'Basic', basicToken],
			[`Negotiate ${negotiateToken}`, 'Negotiate', negotiateToken],
		])('redacts a %s value while keeping the scheme', (input, scheme, redactedValue) => {
			const result = scrubText(`Authorization: ${input}`);

			expect(result).toContain(scheme);
			expect(result).toContain(REDACTED);
			expect(result).not.toContain(redactedValue);
		});

		it('redacts an authorization header rendered as an object property', () => {
			expect(scrubText('{"Authorization":"Bearer abc123def456"}')).not.toContain('abc123def456');
		});
	});

	describe('oauth payloads', () => {
		it('redacts an access token out of a token response and keeps non-sensitive data', () => {
			const body = '{"token_type":"Bearer","expires_in":3599,"access_token":"eyJ0eXAiOiJKV1Qi.abc.def"}';
			const result = scrubText(body);

			expect(result).not.toContain('eyJ0eXAiOiJKV1Qi.abc.def');
			expect(result).toContain('expires_in');
		});

		it('redacts a client secret out of a form body', () => {
			expect(scrubText('grant_type=client_credentials&client_id=abc&client_secret=s3cr3t-value')).not.toContain('s3cr3t-value');
		});

		it('keeps the error description, which is what an admin needs', () => {
			const body = '{"error":"invalid_client","error_description":"AADSTS7000215: Invalid client secret provided."}';
			expect(scrubText(body)).toContain('AADSTS7000215');
		});
	});

	describe('soap security', () => {
		it('redacts a WS-Security password element', () => {
			const xml = '<wsse:Password Type="PasswordText">hunter2</wsse:Password>';
			const result = scrubText(xml);

			expect(result).not.toContain('hunter2');
			expect(result).toContain('wsse:Password');
		});

		it('redacts a password field in a form or object rendering', () => {
			expect(scrubText('username=svc-rc&password=hunter2')).not.toContain('hunter2');
		});
	});

	describe('what it leaves alone', () => {
		const mailboxMessage = 'mailbox user@corp.example not found';
		const endpointUrl = 'https://exchange.corp.example/EWS/Exchange.asmx';
		const impersonationHeader = '<t:PrimarySmtpAddress>user@corp.example</t:PrimarySmtpAddress>';

		it.each([
			['a mailbox address', mailboxMessage],
			['an endpoint URL', endpointUrl],
			['an impersonation header, which carries no secret', impersonationHeader],
		])('does not touch %s', (_label, value) => {
			expect(scrubText(value)).toBe(value);
		});
	});
});

describe('scrubForLog', () => {
	it('reduces an error to name, message, code and detail', () => {
		const err = Object.assign(new Error('Bearer abc123def456 was rejected'), { code: 'authentication-failed', detail: 'password=hunter2' });

		expect(scrubForLog(err)).toEqual({
			name: 'Error',
			message: `Bearer ${REDACTED} was rejected`,
			code: 'authentication-failed',
			detail: `password=${REDACTED}`,
		});
	});

	it('drops everything else an error carries, since transport errors hold request options', () => {
		const err = Object.assign(new Error('boom'), { options: { headers: { Authorization: 'Bearer leak-me-please' } } });

		expect(JSON.stringify(scrubForLog(err))).not.toContain('leak-me-please');
	});

	it('walks objects and arrays', () => {
		const result = scrubForLog({ headers: { Authorization: 'Bearer abc123def456' }, tries: [1, 'Basic Q29ycFxzdmM6cHc='] });

		expect(JSON.stringify(result)).not.toContain('abc123def456');
		expect(JSON.stringify(result)).not.toContain('Q29ycFxzdmM6cHc=');
	});

	it('passes non-string primitives through untouched', () => {
		const obj = { status: 401, ok: false, missing: null };
		expect(scrubForLog(obj)).toEqual(obj);
	});

	it('stops descending rather than following a cyclic cause chain forever', () => {
		const a: Record<string, unknown> = {};
		a.self = a;

		expect(() => scrubForLog(a)).not.toThrow();
		expect(JSON.stringify(scrubForLog(a))).toContain('truncated');
	});
});
