import { describe, it, expect } from 'vitest';
import * as EmojiUtils from '@rocket.chat/core-typings';

describe('Malformed Emoji Handling', () => {
	describe('isSafeEmoji - Type Guard', () => {
		it('should validate a proper SafeEmoji object', () => {
			const safeEmoji: EmojiUtils.SafeEmoji = {
				name: 'test-emoji',
				url: 'https://example.com/emoji.png',
				extension: 'png',
			};
			expect(EmojiUtils.isSafeEmoji(safeEmoji)).toBe(true);
		});

		it('should reject undefined', () => {
			expect(EmojiUtils.isSafeEmoji(undefined)).toBe(false);
		});

		it('should reject null', () => {
			expect(EmojiUtils.isSafeEmoji(null)).toBe(false);
		});

		it('should reject object with missing name', () => {
			const emoji = { url: 'https://example.com/emoji.png' };
			expect(EmojiUtils.isSafeEmoji(emoji)).toBe(false);
		});

		it('should reject object with missing url', () => {
			const emoji = { name: 'test' };
			expect(EmojiUtils.isSafeEmoji(emoji)).toBe(false);
		});

		it('should reject object with empty name', () => {
			const emoji = { name: '', url: 'https://example.com/emoji.png' };
			expect(EmojiUtils.isSafeEmoji(emoji)).toBe(false);
		});

		it('should reject object with empty url', () => {
			const emoji = { name: 'test', url: '' };
			expect(EmojiUtils.isSafeEmoji(emoji)).toBe(false);
		});

		it('should reject object with non-string name', () => {
			const emoji = { name: 123, url: 'https://example.com/emoji.png' };
			expect(EmojiUtils.isSafeEmoji(emoji)).toBe(false);
		});

		it('should reject object with non-string url', () => {
			const emoji = { name: 'test', url: 123 };
			expect(EmojiUtils.isSafeEmoji(emoji)).toBe(false);
		});
	});

	describe('getSafeEmojiName', () => {
		it('should return valid name from proper emoji object', () => {
			const emoji = { name: 'my-emoji' };
			expect(EmojiUtils.getSafeEmojiName(emoji)).toBe('my-emoji');
		});

		it('should return fallback for undefined emoji', () => {
			expect(EmojiUtils.getSafeEmojiName(undefined)).toBe('[invalid-emoji]');
		});

		it('should return fallback for null emoji', () => {
			expect(EmojiUtils.getSafeEmojiName(null)).toBe('[invalid-emoji]');
		});

		it('should return fallback for emoji with undefined name', () => {
			const emoji = { url: 'https://example.com/emoji.png' };
			expect(EmojiUtils.getSafeEmojiName(emoji)).toBe('[invalid-emoji]');
		});

		it('should return fallback for emoji with null name', () => {
			const emoji = { name: null };
			expect(EmojiUtils.getSafeEmojiName(emoji)).toBe('[invalid-emoji]');
		});

		it('should return fallback for emoji with non-string name', () => {
			const emoji = { name: 123 };
			expect(EmojiUtils.getSafeEmojiName(emoji)).toBe('[invalid-emoji]');
		});

		it('should handle name with special characters safely', () => {
			const emoji = { name: '+1_tone5' };
			expect(EmojiUtils.getSafeEmojiName(emoji)).toBe('+1_tone5');
		});
	});

	describe('getSafeEmojiUrl', () => {
		it('should return valid url from proper emoji object', () => {
			const emoji = { url: 'https://example.com/emoji.png' };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBe('https://example.com/emoji.png');
		});

		it('should return undefined for emoji without url', () => {
			const emoji = { name: 'test' };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBeUndefined();
		});

		it('should return undefined for undefined emoji', () => {
			expect(EmojiUtils.getSafeEmojiUrl(undefined)).toBeUndefined();
		});

		it('should return undefined for null emoji', () => {
			expect(EmojiUtils.getSafeEmojiUrl(null)).toBeUndefined();
		});

		it('should return undefined for emoji with undefined url', () => {
			const emoji = { name: 'test', url: undefined };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBeUndefined();
		});

		it('should return undefined for emoji with null url', () => {
			const emoji = { name: 'test', url: null };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBeUndefined();
		});

		it('should return undefined for emoji with non-string url', () => {
			const emoji = { url: 123 };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBeUndefined();
		});

		it('should return undefined for emoji with empty url', () => {
			const emoji = { url: '' };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBeUndefined();
		});

		it('should handle relative URLs safely', () => {
			const emoji = { url: '/emoji-custom/test.png' };
			expect(EmojiUtils.getSafeEmojiUrl(emoji)).toBe('/emoji-custom/test.png');
		});
	});
});
