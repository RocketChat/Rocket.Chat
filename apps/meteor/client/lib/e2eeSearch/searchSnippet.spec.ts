import { parseSearchSnippet, parseSearchSnippetLines } from './searchSnippet';

describe('parseSearchSnippet', () => {
	it('turns the <mark> tags into highlighted parts', () => {
		expect(parseSearchSnippet('the <mark>needle</mark> is here')).toEqual([
			{ text: 'the ', marked: false },
			{ text: 'needle', marked: true },
			{ text: ' is here', marked: false },
		]);
	});

	it('decodes the escaped characters of the message text', () => {
		expect(parseSearchSnippet('a &lt;b&gt; &amp; &quot;c&quot; &#39;d&#39;')).toEqual([{ text: 'a <b> & "c" \'d\'', marked: false }]);
	});

	it('keeps an escaped tag as text, also inside a highlight', () => {
		expect(parseSearchSnippet('<mark>&lt;img src=x onerror=alert(1)&gt;</mark>')).toEqual([
			{ text: '<img src=x onerror=alert(1)>', marked: true },
		]);
	});

	it('keeps a raw tag other than <mark> as text', () => {
		expect(parseSearchSnippet('<b>bold</b> <script>x()</script>')).toEqual([{ text: '<b>bold</b> <script>x()</script>', marked: false }]);
	});

	it('does not decode an entity twice', () => {
		expect(parseSearchSnippet('&amp;lt;mark&amp;gt;')).toEqual([{ text: '&lt;mark&gt;', marked: false }]);
	});

	it('keeps an escaped <mark> as text, not as a highlight', () => {
		expect(parseSearchSnippet('&lt;mark&gt;fake&lt;/mark&gt;')).toEqual([{ text: '<mark>fake</mark>', marked: false }]);
	});

	it('keeps other entities as they are', () => {
		expect(parseSearchSnippet('&nbsp;&#x3C;')).toEqual([{ text: '&nbsp;&#x3C;', marked: false }]);
	});

	it('ends a highlight that is not closed at the end of the snippet', () => {
		expect(parseSearchSnippet('one <mark>two')).toEqual([
			{ text: 'one ', marked: false },
			{ text: 'two', marked: true },
		]);
	});

	it('joins neighbor highlights and gives no empty parts', () => {
		expect(parseSearchSnippet('<mark>a</mark><mark>b</mark>')).toEqual([{ text: 'ab', marked: true }]);
		expect(parseSearchSnippet('')).toEqual([]);
	});
});

describe('parseSearchSnippetLines', () => {
	it('splits the parts at each line break, so the caption and the file name of a file hit are separate lines', () => {
		expect(parseSearchSnippetLines('Q3 <mark>budget</mark> draft\nbudget-2026.pdf')).toEqual([
			[
				{ text: 'Q3 ', marked: false },
				{ text: 'budget', marked: true },
				{ text: ' draft', marked: false },
			],
			[{ text: 'budget-2026.pdf', marked: false }],
		]);
	});

	it('splits a highlight that holds a line break, and gives no empty lines', () => {
		expect(parseSearchSnippetLines('<mark>one\r\ntwo</mark>\n\n \nthree\n')).toEqual([
			[{ text: 'one', marked: true }],
			[{ text: 'two', marked: true }],
			[{ text: 'three', marked: false }],
		]);
		expect(parseSearchSnippetLines('')).toEqual([]);
	});
});
