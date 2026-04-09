import { isSafeAvatarUrl } from './isSafeAvatarUrl';

describe('valid URLs', () => {
	it('should accept HTTPS URLs', () => {
		expect(isSafeAvatarUrl('https://example.com/avatar.png')).toBe(true);
		expect(isSafeAvatarUrl('https://cdn.example.com/user/123/avatar.jpg')).toBe(true);
	});

	it('should accept HTTP URLs', () => {
		expect(isSafeAvatarUrl('http://example.com/avatar.png')).toBe(true);
		expect(isSafeAvatarUrl('http://localhost:3000/avatar.png')).toBe(true);
	});

	it('should accept data URLs with image MIME types', () => {
		expect(isSafeAvatarUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg')).toBe(true);
		expect(isSafeAvatarUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg')).toBe(true);
		expect(isSafeAvatarUrl('data:image/gif;base64,R0lGODlh')).toBe(true);
		expect(isSafeAvatarUrl('data:image/webp;base64,UklGRiQA')).toBe(true);
		expect(isSafeAvatarUrl('data:image/svg+xml;base64,PHN2Zw')).toBe(true);
	});

	it('should be case-insensitive for protocols', () => {
		expect(isSafeAvatarUrl('HTTPS://example.com/avatar.png')).toBe(true);
		expect(isSafeAvatarUrl('HTTP://example.com/avatar.png')).toBe(true);
		expect(isSafeAvatarUrl('DATA:IMAGE/PNG;base64,iVBORw0KGgoAAAANSUhEUg')).toBe(true);
	});
});

describe('invalid URLs', () => {
	it('should reject javascript: protocol', () => {
		expect(isSafeAvatarUrl('javascript:alert(1)')).toBe(false);
		expect(isSafeAvatarUrl('javascript:void(0)')).toBe(false);
	});

	it('should reject file: protocol', () => {
		expect(isSafeAvatarUrl('file:///etc/passwd')).toBe(false);
		expect(isSafeAvatarUrl('file:///C:/Windows/System32')).toBe(false);
	});

	it('should reject data: URLs with non-image MIME types', () => {
		expect(isSafeAvatarUrl('data:text/html;base64,PHNjcmlwdD4')).toBe(false);
		expect(isSafeAvatarUrl('data:text/javascript;base64,YWxlcnQoMSk')).toBe(false);
		expect(isSafeAvatarUrl('data:application/javascript;base64,YWxlcnQoMSk')).toBe(false);
		expect(isSafeAvatarUrl('data:text/plain;base64,SGVsbG8=')).toBe(false);
	});

	it('should reject ftp: protocol', () => {
		expect(isSafeAvatarUrl('ftp://example.com/avatar.png')).toBe(false);
	});

	it('should reject malformed URLs', () => {
		expect(isSafeAvatarUrl('not a url')).toBe(false);
		expect(isSafeAvatarUrl('htp://missing-t.com')).toBe(false);
		expect(isSafeAvatarUrl('://example.com')).toBe(false);
	});

	it('should reject empty strings', () => {
		expect(isSafeAvatarUrl('')).toBe(false);
	});

	it('should reject other dangerous protocols', () => {
		expect(isSafeAvatarUrl('vbscript:msgbox(1)')).toBe(false);
		expect(isSafeAvatarUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
	});
});

describe('URL edge cases', () => {
	it('should handle URLs with query parameters', () => {
		expect(isSafeAvatarUrl('https://example.com/avatar.png?size=large&format=webp')).toBe(true);
	});

	it('should handle URLs with fragments', () => {
		expect(isSafeAvatarUrl('https://example.com/avatar.png#profile')).toBe(true);
	});

	it('should handle URLs with authentication', () => {
		expect(isSafeAvatarUrl('https://user:pass@example.com/avatar.png')).toBe(true);
	});

	it('should handle URLs with non-standard ports', () => {
		expect(isSafeAvatarUrl('http://example.com:8080/avatar.png')).toBe(true);
		expect(isSafeAvatarUrl('https://example.com:443/avatar.png')).toBe(true);
	});
});
