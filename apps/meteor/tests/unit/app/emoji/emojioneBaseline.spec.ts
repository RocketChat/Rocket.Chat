import { expect } from 'chai';
import { describe, it } from 'mocha';
import emojione from 'emojione';

import { getEmojiConfig } from '../../../../app/emoji-emojione/lib/getEmojiConfig';

// Baseline for the native-emoji migration: these assertions document behavior 8.6 users rely on.
// The counterpart PR against release-8.7.0 carries the same expectations as (currently failing)
// tests over the new emoji-native implementation.
describe('emojione baseline (pre-native-migration behavior)', () => {
	describe('shortnameToUnicode', () => {
		const cases: [string, string][] = [
			[':red_haired:', '🦰'],
			[':curly_haired:', '🦱'],
			[':bald:', '🦲'],
			[':white_haired:', '🦳'],
			[':iphone:', '📱'],
		];

		cases.forEach(([shortname, unicode]) => {
			it(`converts ${shortname}`, () => {
				expect(emojione.shortnameToUnicode(shortname)).to.equal(unicode);
			});
		});

		it('converts a shortcode that directly follows an unknown :token:', () => {
			expect(emojione.shortnameToUnicode('12:30:fire:')).to.equal('12:30🔥');
		});

		it('renders the hand-patched legacy shortcodes in messages', () => {
			// shortnameToUnicode drops the U+20E3 combiner for these hand-patched entries even on 8.6;
			// the message path users actually saw went through render (emojione.toImage)
			const html = getEmojiConfig().render(':digit_one:');
			expect(html).to.be.a('string');
			expect(html).to.include('digit_one');
		});
	});

	describe('toShort', () => {
		it('maps bare (unqualified) text-presentation emojis to shortnames', () => {
			expect(emojione.toShort('❤')).to.equal(':heart:');
			expect(emojione.toShort('☺')).to.equal(':relaxed:');
		});
	});

	describe('picker rendering', () => {
		it('renders the hand-patched legacy shortcodes', () => {
			const image = getEmojiConfig().renderPicker(':digit_one:');
			expect(image).to.be.a('string');
			expect(image).to.include('digit_one');
		});
	});
});
