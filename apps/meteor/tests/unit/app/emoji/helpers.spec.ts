import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';

import { updateRecent, removeFromRecent, replaceEmojiInRecent } from '../../../../app/emoji/client/helpers';
import { emoji } from '../../../../app/emoji/client/lib';

describe('Emoji Client Helpers', () => {
	beforeEach(() => {
		emoji.packages.base.emojisByCategory.recent = [];
	});

	describe('updateRecent', () => {
		it('should update recent emojis with the provided emojis', () => {
			const recentEmojis = ['emoji1', 'emoji2'];
			updateRecent(recentEmojis);
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji1');
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji2');
		});
	});

	describe('removeFromRecent', () => {
		it('should remove a specific emoji from recent emojis', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2', 'emoji3'];
			removeFromRecent('emoji2', emoji.packages.base.emojisByCategory.recent);
			expect(emoji.packages.base.emojisByCategory.recent).to.not.include('emoji2');
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji3']);
		});

		it('should do nothing if the emoji is not in the recent list', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2'];
			removeFromRecent('emoji3', emoji.packages.base.emojisByCategory.recent);
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji2']);
		});
	});

	describe('replaceEmojiInRecent', () => {
		it('should replace an existing emoji with a new one in recent emojis', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2', 'emoji3'];
			replaceEmojiInRecent({ oldEmoji: 'emoji2', newEmoji: 'emoji4' });
			expect(emoji.packages.base.emojisByCategory.recent).to.not.include('emoji2');
			expect(emoji.packages.base.emojisByCategory.recent).to.include('emoji4');
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji4', 'emoji3']);
		});

		it('should do nothing if the emoji to replace is not in the recent list', () => {
			emoji.packages.base.emojisByCategory.recent = ['emoji1', 'emoji2'];
			replaceEmojiInRecent({ oldEmoji: 'emoji3', newEmoji: 'emoji4' });
			expect(emoji.packages.base.emojisByCategory.recent).to.deep.equal(['emoji1', 'emoji2']);
		});
	});
});
