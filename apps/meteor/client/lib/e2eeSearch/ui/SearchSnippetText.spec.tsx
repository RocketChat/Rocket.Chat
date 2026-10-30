import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';

import * as stories from './SearchSnippetText.stories';

const { Default, File, MultilineHighlight, UnclosedHighlight, AdjacentHighlights, EscapedText, UnsafeMarkup, LiteralHighlight, Empty } =
	composeStories(stories);

it('shows only the matching text as a highlight', () => {
	const { container } = render(<Default />);

	expect(container).toHaveTextContent('The needle is here.');
	expect(container.querySelectorAll('mark')).toHaveLength(1);
	expect(screen.getByText('needle').tagName).toBe('MARK');
});

it('shows the caption and file name on separate lines', () => {
	const { container } = render(<File />);

	expect(Array.from(container.children).map((line) => line.textContent)).toEqual(['Q3 budget draft', 'budget-2026.pdf']);
	expect(screen.getByText('budget').tagName).toBe('MARK');
});

it('preserves highlights across line breaks and omits blank lines', () => {
	const { container } = render(<MultilineHighlight />);

	expect(Array.from(container.children).map((line) => line.textContent)).toEqual(['one', 'two', 'three']);
	expect(Array.from(container.querySelectorAll('mark')).map((mark) => mark.textContent)).toEqual(['one', 'two']);
});

it('keeps an unclosed highlight through the end of the snippet', () => {
	render(<UnclosedHighlight />);

	expect(screen.getByText('two').tagName).toBe('MARK');
});

it('joins adjacent highlights', () => {
	const { container } = render(<AdjacentHighlights />);

	expect(container.querySelectorAll('mark')).toHaveLength(1);
	expect(screen.getByText('onetwo').tagName).toBe('MARK');
});

it('decodes the supported entities once', () => {
	const { container } = render(<EscapedText />);

	expect(container.textContent).toBe('a <b> & "c" \'d\'');
	expect(container.querySelector('b')).toBeNull();
});

it('keeps raw and escaped markup as text', () => {
	const { container } = render(<UnsafeMarkup />);

	expect(container.querySelector('script, img')).toBeNull();
	expect(container.textContent).toBe('<script>alert(1)</script> <img src=x onerror=alert(1)>');
	expect(screen.getByText('<img src=x onerror=alert(1)>').tagName).toBe('MARK');
});

it('does not treat escaped highlights as markup or decode entities twice', () => {
	const { container } = render(<LiteralHighlight />);

	expect(container.querySelector('mark')).toBeNull();
	expect(container.textContent).toBe('<mark>fake</mark> &lt;mark&gt; &nbsp;&#x3C;');
});

it('renders no lines for an empty snippet', () => {
	const { container } = render(<Empty />);

	expect(container).toBeEmptyDOMElement();
});
