import { expect } from 'chai';
import { describe, it } from 'mocha';

import { sanitizeFileName } from './sanitizeFileName';

describe('sanitizeFileName', () => {
	describe('valid filenames', () => {
		it('should allow simple filenames', () => {
			const result = sanitizeFileName('sound.mp3');
			expect(result).to.equal('sound.mp3');
		});

		it('should allow filenames with dashes, underscores and dots', () => {
			const result = sanitizeFileName('alert_test-01.wav');
			expect(result).to.equal('alert_test-01.wav');
		});

		it('should allow filenames without extension', () => {
			const result = sanitizeFileName('beep');
			expect(result).to.equal('beep');
		});
	});

	describe('invalid paths', () => {
		it('should reject path traversal using ../', () => {
			expect(() => sanitizeFileName('../etc/passwd')).to.throw();
		});

		it('should reject path traversal using ./', () => {
			expect(() => sanitizeFileName('./folder/sounds')).to.throw();
		});

		it('should reject nested paths', () => {
			expect(() => sanitizeFileName('sounds/alert.mp3')).to.throw();
		});

		it('should reject absolute paths', () => {
			expect(() => sanitizeFileName('/etc/passwd')).to.throw();
		});
	});

	describe('invalid characters', () => {
		it('should reject filenames with spaces', () => {
			expect(() => sanitizeFileName('my sound.mp3')).to.throw();
		});

		it('should reject filenames with special characters', () => {
			expect(() => sanitizeFileName('sound$.mp3')).to.throw();
		});

		it('should reject filenames with backslashes', () => {
			expect(() => sanitizeFileName('..\\passwd')).to.throw();
		});
	});
});
