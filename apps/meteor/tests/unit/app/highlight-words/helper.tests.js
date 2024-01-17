import { expect } from 'chai';

import { highlightWords, getRegexHighlight, getRegexHighlightUrl } from '../../../../app/highlight-words/client/helper';

describe('helper', () => {
	describe('highlightWords', () => {
		it('highlights the correct words', () => {
			const res = highlightWords(
				'here is some word',
				['word'].map((highlight) => ({
					highlight,
					regex: getRegexHighlight(highlight),
					urlRegex: getRegexHighlightUrl(highlight),
				})),
			);

			expect(res).to.be.equal('here is some <mark class="highlight-text">word</mark>');
		});

		describe('handles links', () => {
			it('not highlighting one link', () => {
				const res = highlightWords(
					'here we go https://somedomain.com/here-some.word/pulls more words after',
					['word'].map((highlight) => ({
						highlight,
						regex: getRegexHighlight(highlight),
						urlRegex: getRegexHighlightUrl(highlight),
					})),
				);

				expect(res).to.be.equal('here we go https://somedomain.com/here-some.word/pulls more words after');
			});

			it('not highlighting two links', () => {
				const msg = 'here https://somedomain.com/here-some-foo/pulls more words after http://www.domain.com/some.foo/bar words after';
				const res = highlightWords(
					msg,
					['foo'].map((highlight) => ({
						highlight,
						regex: getRegexHighlight(highlight),
						urlRegex: getRegexHighlightUrl(highlight),
					})),
				);

				expect(res).to.be.equal(msg);
			});

			it('not highlighting link but keep words on message highlighted', () => {
				const res = highlightWords(
					'here we go https://somedomain.com/here-some.foo/pulls more foo after',
					['foo'].map((highlight) => ({
						highlight,
						regex: getRegexHighlight(highlight),
						urlRegex: getRegexHighlightUrl(highlight),
					})),
				);

				expect(res).to.be.equal('here we go https://somedomain.com/here-some.foo/pulls more <mark class="highlight-text">foo</mark> after');
			});
		});
	});
});
