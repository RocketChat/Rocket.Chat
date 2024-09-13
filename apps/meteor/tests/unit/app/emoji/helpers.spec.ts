import { expect } from 'chai';
import { describe, it } from 'mocha';

import { updateRecent } from '../../../../app/emoji/client/helpers';
import { emoji } from '../../../../app/emoji/client/lib';

describe('Emoji Client Helpers', () => {
	describe('updateRecent', () => {
		it('should update recent emojis when passed an array', () => {
			const recentEmojis = ['emoji1', 'emoji2'];
			updateRecent(recentEmojis);
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji1');
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji2');
		});

		it('should update recent emojis when passed a string', () => {
			updateRecent('emoji1');
			expect(emoji.packages.base.emojisByCategory.recent).to.contain('emoji1');
		});
	});
});
