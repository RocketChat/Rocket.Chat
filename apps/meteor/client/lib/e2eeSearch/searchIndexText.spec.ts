import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';

import { indexText, queryTokens, toSnippet } from './searchIndexText';

const equivalents = [
	['한글', '한글'],
	['oﬃce', 'office'],
	['Ｆｕｌｌｗｉｄｔｈ', 'fullwidth'],
	['Άλφα', 'αλφα'],
	['café', 'café'],
	['ΟΣ', 'οσ'],
];

describe('search index text normalization', () => {
	it.each(equivalents)('uses the same indexed and query representation for %s and %s', (original, equivalent) => {
		expect(indexText(original)).toBe(indexText(equivalent));
		expect(queryTokens(original)).toEqual(queryTokens(equivalent));
		expect(indexText(original)).toBe(queryTokens(original).join(' '));
	});

	it('indexes all words without applying the query token limit', () => {
		const words = Array.from({ length: E2EE_SEARCH_LIMITS.maxQueryTokens + 5 }, (_, i) => `word${i}`);
		expect(indexText(words.join(' '))).toBe(words.join(' '));
		expect(queryTokens(words.join(' '))).toEqual(words.slice(0, E2EE_SEARCH_LIMITS.maxQueryTokens));
		expect(queryTokens('... ́')).toEqual([]);
	});

	it.each(equivalents)('highlights the original %s text for an equivalent prefix', (original, equivalent) => {
		const prefix = [...equivalent].slice(0, -1).join('');
		expect(toSnippet(`<${original}> & "'`, queryTokens(prefix))).toBe(`&lt;<mark>${original}</mark>&gt; &amp; &quot;&#39;`);
	});

	it('uses compatibility word boundaries when it highlights an original word', () => {
		expect(queryTokens('¼')).toEqual(['1', '4']);
		expect(toSnippet('¼', queryTokens('4'))).toBe('<mark>¼</mark>');
	});
});
