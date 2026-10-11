import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getEmojiNameWithoutTone, isRestrictedEmoji, normalizeEmojiName, parseRestrictedEmojis } from '../../../lib/emoji/restrictedEmojis';

describe('restrictedEmojis helpers', () => {
	describe('normalizeEmojiName', () => {
		it('should trim, lowercase and strip surrounding colons', () => {
			expect(normalizeEmojiName(' :Middle_Finger: ')).to.equal('middle_finger');
		});

		it('should leave plain names unchanged aside from casing', () => {
			expect(normalizeEmojiName('Eggplant')).to.equal('eggplant');
		});

		it('should return an empty string for non-string values', () => {
			expect(normalizeEmojiName(undefined)).to.equal('');
			expect(normalizeEmojiName(null)).to.equal('');
		});
	});

	describe('getEmojiNameWithoutTone', () => {
		it('should strip tone suffixes', () => {
			expect(getEmojiNameWithoutTone('middle_finger_tone2')).to.equal('middle_finger');
			expect(getEmojiNameWithoutTone(':peach_tone5:')).to.equal('peach');
		});

		it('should keep names without tones', () => {
			expect(getEmojiNameWithoutTone('smile')).to.equal('smile');
		});
	});

	describe('parseRestrictedEmojis', () => {
		it('should parse, normalize, strip tones and dedupe values', () => {
			expect(parseRestrictedEmojis(':eggplant:, Peach , MIDDLE_FINGER, eggplant_tone2')).to.deep.equal([
				'eggplant',
				'peach',
				'middle_finger',
			]);
		});

		it('should return an empty array for empty values', () => {
			expect(parseRestrictedEmojis('')).to.deep.equal([]);
			expect(parseRestrictedEmojis(undefined)).to.deep.equal([]);
			expect(parseRestrictedEmojis(null)).to.deep.equal([]);
		});
	});

	describe('isRestrictedEmoji', () => {
		const restricted = parseRestrictedEmojis('middle_finger,eggplant');

		it('should match exact names', () => {
			expect(isRestrictedEmoji('eggplant', restricted)).to.equal(true);
			expect(isRestrictedEmoji('smile', restricted)).to.equal(false);
		});

		it('should match tone variants of a restricted base name', () => {
			expect(isRestrictedEmoji('middle_finger_tone2', restricted)).to.equal(true);
		});

		it('should match names wrapped in colons', () => {
			expect(isRestrictedEmoji(':eggplant:', restricted)).to.equal(true);
		});

		it('should return false when the restriction list is empty', () => {
			expect(isRestrictedEmoji('eggplant', [])).to.equal(false);
		});

		it('should return false for undefined emoji names', () => {
			expect(isRestrictedEmoji(undefined, restricted)).to.equal(false);
		});
	});
});
