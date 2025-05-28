import { sanitizeUrl } from './sanitizeUrl';

describe('sanitizeUrl', () => {
	it('allows safe HTTP URLs', () => {
		expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
	});

	it('allows safe HTTPS URLs', () => {
		expect(sanitizeUrl('https://secure.com')).toBe('https://secure.com/');
	});

	it('allows safe URLs with query parameters', () => {
		const testCases = [
			{
				input: 'https://example.com/?q=test',
				expected: 'https://example.com/?q=test',
			},
			{
				input: 'http://example.com/search?query=hello+world',
				expected: 'http://example.com/search?query=hello+world',
			},
			{
				input: 'https://example.com/path?param1=value1&param2=value2',
				expected: 'https://example.com/path?param1=value1&param2=value2',
			},
			{
				input: 'https://example.com/?redirect=http://safe.com',
				expected: 'https://example.com/?redirect=http://safe.com',
			},

			{
				input: 'https://example.com/?xss=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
				expected: 'https://example.com/?xss=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
			},
			{
				input: 'https://example.com/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
				expected: 'https://example.com/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
			},
			{
				input: 'https://example.com/?param1=%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E',
				expected: 'https://example.com/?param1=%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E',
			},
			{
				input: 'https://example.com/?q=%3Cimg+src%3D%22javascript%3Aalert(1)%22%3E',
				expected: 'https://example.com/?q=%3Cimg+src%3D%22javascript%3Aalert(1)%22%3E',
			},
		];

		testCases.forEach(({ input, expected }) => {
			expect(sanitizeUrl(input)).toBe(expected);
		});
	});

	describe('sanitizeUrl - XSS Payloads', () => {
		it('sanitizes javascript: URLs', () => {
			const payloads = [
				'javascript:alert(1)',
				'javascript:confirm("XSS")',
				'javascript:/*XSS*/alert(1)',
				'javascript:eval("alert(1)")',
				'javascript:window.location="http://evil.com"',
			];

			payloads.forEach((payload) => {
				expect(sanitizeUrl(payload)).toBe('#');
			});
		});

		it('sanitizes data: URLs', () => {
			const payloads = [
				'data:text/html,<script>alert("XSS")</script>',
				'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
				'data:image/svg+xml,<svg onload=alert(1)>',
				'data:text/html,<iframe src="javascript:alert(1)"></iframe>',
				'data:text/html;charset=utf-8,<script>confirm("XSS")</script>',
			];

			payloads.forEach((payload) => {
				expect(sanitizeUrl(payload)).toBe('#');
			});
		});

		it('sanitizes vbscript: URLs', () => {
			const payloads = [
				'vbscript:msgbox("XSS")',
				'vbscript:alert("Hello")',
				'vbscript:Execute("msgbox(123)")',
				'VBScript:CreateObject("WScript.Shell").Run("calc")',
				'VBSCRIPT:MsgBox("payload")',
			];

			payloads.forEach((payload) => {
				expect(sanitizeUrl(payload)).toBe('#');
			});
		});
	});

	it('sanitizes malformed URLs', () => {
		expect(sanitizeUrl('ht^tp://broken')).toBe('#');
	});

	it('sanitizes empty string', () => {
		expect(sanitizeUrl('')).toBe('#');
	});

	it('is case-insensitive with protocols', () => {
		expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('#');
	});

	it('sanitizes nonsense input', () => {
		expect(sanitizeUrl('💣💥🤯')).toBe('#');
	});
});
