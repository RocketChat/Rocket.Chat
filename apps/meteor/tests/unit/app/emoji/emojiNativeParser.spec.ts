import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getEmojiData } from '../../../../app/emoji-native/lib/generateEmojiData';
import { shortnameToUnicode } from '../../../../app/emoji-native/lib/shortnameToUnicode';

describe('emoji-native shortcode resolution', () => {
	describe('shortnameToUnicode', () => {
		it('resolves skin-tone variants stored under emojione alternate names', () => {
			expect(shortnameToUnicode(':thumbsup_tone3:')).to.equal('👍🏽');
			expect(shortnameToUnicode(':yes_tone3:')).to.equal('👍🏽');
			expect(shortnameToUnicode(':clapping_hands_tone2:')).to.equal('👏🏼');
			expect(shortnameToUnicode(':pray_tone4:')).to.equal('🙏🏾');
		});

		it('still resolves the emojibase primary skin-tone name', () => {
			expect(shortnameToUnicode(':+1_tone3:')).to.equal('👍🏽');
		});

		it('resolves regional indicator letters', () => {
			expect(shortnameToUnicode(':regional_indicator_a:')).to.equal('🇦');
			expect(shortnameToUnicode(':regional_indicator_z:')).to.equal('🇿');
		});

		it('resolves legacy emojione base aliases', () => {
			expect(shortnameToUnicode(':digit_zero:')).to.equal('0️⃣');
			expect(shortnameToUnicode(':digit_nine:')).to.equal('9️⃣');
			expect(shortnameToUnicode(':pound_symbol:')).to.equal('#️⃣');
			expect(shortnameToUnicode(':asterisk_symbol:')).to.equal('*️⃣');
			expect(shortnameToUnicode(':tone3:')).to.equal('🏽');
		});

		it('leaves unknown shortcodes untouched', () => {
			expect(shortnameToUnicode(':not_a_real_emoji:')).to.equal(':not_a_real_emoji:');
		});

		it('resolves multiple shortcodes within a single string', () => {
			expect(shortnameToUnicode('hi :thumbsup_tone3: and :regional_indicator_a:')).to.equal('hi 👍🏽 and 🇦');
		});
	});

	describe('getEmojiData', () => {
		it('registers regional indicators in emojiList but keeps them out of the picker', () => {
			const { emojiList, emojisByCategory } = getEmojiData();
			expect(emojiList[':regional_indicator_a:']?.unicode).to.equal('🇦');
			expect(emojisByCategory.flags).to.not.include('regional_indicator_a');
		});

		it('registers alternate skin-tone shortnames alongside the primary', () => {
			const { emojiList } = getEmojiData();
			expect(emojiList[':thumbsup_tone3:']?.unicode).to.equal('👍🏽');
			expect(emojiList[':yes_tone3:']?.unicode).to.equal('👍🏽');
			expect(emojiList[':+1_tone3:']?.unicode).to.equal('👍🏽');
		});
	});
});
