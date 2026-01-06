import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../app/emoji/client', () => {
	const emoji = {} as any;
	return {
		emoji,
		removeFromRecent: vi.fn(),
		replaceEmojiInRecent: vi.fn(),
	};
});

vi.mock('../../app/utils/client', () => ({
	getURL: vi.fn((path: string) => path),
}));

import { updateEmojiCustom, deleteEmojiCustom, customRender, getEmojiUrlFromName } from '../customEmoji';
import { emoji as emojiStore } from '../../app/emoji/client';

/**
 * Test suite for customEmoji module defensive programming enhancements
 *
 * These tests verify that the custom emoji handling code safely handles:
 * - Undefined/null emoji data
 * - Missing required properties
 * - Invalid data types
 * - Malformed emoji metadata
 * - Cache invalidation scenarios
 */

describe('customEmoji - Defensive Programming', () => {
	const resetEmojiStore = () => {
		Object.keys(emojiStore).forEach((key) => delete (emojiStore as any)[key]);
		Object.assign(emojiStore, {
			list: {},
			packages: {
				emojiCustom: {
					emojisByCategory: { rocket: [] },
					list: [],
					_regexpSignature: null,
					_regexp: null,
				},
				base: {
					emojisByCategory: {
						recent: [],
					},
				},
			},
			dispatchUpdate: vi.fn(),
		});
	};

	beforeEach(() => {
		resetEmojiStore();
		vi.clearAllMocks();
	});

	afterEach(() => {
		resetEmojiStore();
	});

	describe('updateEmojiCustom - Null Safety', () => {
		it('should handle undefined emoji data gracefully', () => {
			expect(() => updateEmojiCustom(undefined as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle null emoji data gracefully', () => {
			expect(() => updateEmojiCustom(null as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle emoji data with missing name property', () => {
			const emojiData = { aliases: ['test'] };
			expect(() => updateEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle emoji data with null name', () => {
			const emojiData = { name: null, aliases: [] };
			expect(() => updateEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle emoji data with numeric name', () => {
			const emojiData = { name: 123, aliases: [] };
			expect(() => updateEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle emoji data with empty string name', () => {
			const emojiData = { name: '', aliases: [] };
			expect(() => updateEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});
	});

	describe('deleteEmojiCustom - Null Safety', () => {
		it('should handle deletion of undefined emoji safely', () => {
			expect(() => deleteEmojiCustom(undefined as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle deletion of emoji with missing aliases property', () => {
			const emojiData = { name: 'test' };
			expect(() => deleteEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle deletion of emoji with null aliases', () => {
			const emojiData = { name: 'test', aliases: null };
			expect(() => deleteEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});

		it('should handle deletion of emoji with corrupted aliases array', () => {
			const emojiData = { name: 'test', aliases: [null, undefined, 123, 'valid-alias'] };
			expect(() => deleteEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});
	});

	describe('customRender - HTML Escaping', () => {
		it('should escape special characters in emoji names', () => {
			emojiStore.packages.emojiCustom.list = [':evil&name:'];
			emojiStore.list[':evil&name:'] = { extension: 'png', etag: '123' };

			const rendered = customRender(':evil&name:');

			expect(rendered).toContain('evil&amp;name');
			expect(rendered).toContain('background-image:url(/emoji-custom/evil%26name.png?etag=123)');
		});

		it('should handle undefined input in escapeHtml', () => {
			expect(customRender(undefined as any)).toBe('');
		});

		it('should handle null input in customRender', () => {
			expect(customRender(null as any)).toBe('');
		});

		it('should handle invalid emoji data types in customRender', () => {
			emojiStore.packages.emojiCustom.list = [':test:', null as any, undefined as any];
			emojiStore.list[':test:'] = { extension: 'png' };

			const rendered = customRender(':test:');
			expect(rendered).toContain('data-emoji="test"');
		});
	});

	describe('getEmojiUrlFromName - Null Safety', () => {
		it('should return undefined for null name', () => {
			expect(getEmojiUrlFromName(null as any, 'png')).toBeUndefined();
		});

		it('should return undefined for empty string name', () => {
			expect(getEmojiUrlFromName('', 'png')).toBeUndefined();
		});

		it('should return undefined for undefined name', () => {
			expect(getEmojiUrlFromName(undefined, 'png')).toBeUndefined();
		});

		it('should generate valid URL for valid parameters', () => {
			const result = getEmojiUrlFromName('my-emoji', 'png', 'abc123');
			expect(result).toBe('/emoji-custom/my-emoji.png?etag=abc123');
		});

		it('should handle special characters in emoji name', () => {
			const result = getEmojiUrlFromName('emoji+1_test', 'png');
			expect(result).toBe('/emoji-custom/emoji%2B1_test.png');
		});
	});

	describe('Emoji Alias Handling', () => {
		it('should handle emoji data with null aliasOf property', () => {
			const emojiData = { name: 'test', aliasOf: null };
			emojiStore.packages.emojiCustom.list = [':test:'];
			emojiStore.list[':test:'] = emojiData as any;

			expect(() => customRender(':test:')).not.toThrow();
		});

		it('should handle emoji data with undefined aliasOf property', () => {
			const emojiData = { name: 'test', aliasOf: undefined };
			emojiStore.packages.emojiCustom.list = [':test:'];
			emojiStore.list[':test:'] = emojiData as any;

			expect(() => customRender(':test:')).not.toThrow();
		});

		it('should handle emoji with circular alias reference', () => {
			emojiStore.packages.emojiCustom.list = [':emoji1:'];
			emojiStore.list[':emoji1:'] = { aliasOf: 'emoji2' } as any;
			emojiStore.list[':emoji2:'] = { aliasOf: 'emoji1' } as any;

			expect(() => customRender(':emoji1:')).not.toThrow();
		});
	});

	describe('Type Validation Throughout', () => {
		it('should validate extension is string before use', () => {
			const emojiData = { name: 'test', extension: null };
			emojiStore.packages.emojiCustom.list = [':test:'];
			emojiStore.list[':test:'] = emojiData as any;

			expect(customRender(':test:')).toBe(':test:');
		});

		it('should validate aliases is array before iteration', () => {
			const emojiData = { name: 'test', aliases: 'not-an-array' };
			expect(() => updateEmojiCustom(emojiData as any)).not.toThrow();
			expect(emojiStore.list).toEqual({});
		});
	});
});
