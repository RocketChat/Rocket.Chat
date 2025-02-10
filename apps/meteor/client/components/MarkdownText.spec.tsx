import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import MarkdownText from './MarkdownText';

import '@testing-library/jest-dom';

const normalizeHtml = (html: any) => {
	return html.replace(/\s+/g, ' ').trim();
};

const markdownText = `
  # Heading 1
  **Paragraph text**: *Bold with one asterisk* **Bold with two asterisks** Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  ## Heading 2
  _Italic Text_: _Italic with one underscore_ __Italic with two underscores__ Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  ### Heading 3
  Lists, Links and elements
  **Unordered List**
  - List Item 1
  - List Item 2
  - List Item 3
  - List Item 4
  **Ordered List**
  1. List Item 1
  2. List Item 2
  3. List Item 3
  4. List Item 4
  **Links:**
  [Rocket.Chat](rocket.chat)
  gabriel.engel@rocket.chat
  +55991999999
  \`Inline code\`
  \`\`\`typescript
  const test = 'this is code'
  \`\`\`
  **Bold text within __Italics__**
  *Bold text with single asterik and underscore within _Italics_*
  __Italics within **Bold** text__
  _Italics within *Bold* text with single underscore and asterik_
`;

it('should render html elements as expected using default parser', async () => {
	const { container } = render(<MarkdownText content={markdownText} variant='document' />, {
		wrapper: mockAppRoot().build(),
	});

	const normalizedHtml = normalizeHtml(container.innerHTML);

	expect(normalizedHtml).toContain('<h1>Heading 1</h1>');
	expect(normalizedHtml).toContain(
		'<strong>Paragraph text</strong>: <strong>Bold with one asterisk</strong> <strong>Bold with two asterisks</strong> Lorem ipsum dolor sit amet',
	);
	expect(normalizedHtml).toContain('<h2>Heading 2</h2>');
	expect(normalizedHtml).toContain(
		'<em>Italic Text</em>: <em>Italic with one underscore</em> <em>Italic with two underscores</em> Lorem ipsum dolor sit amet',
	);
	expect(normalizedHtml).toContain('<h3>Heading 3</h3>');
	expect(normalizedHtml).toContain('<ul> <li>List Item 1</li><li>List Item 2</li><li>List Item 3</li><li>List Item 4');
	expect(normalizedHtml).toContain('<ol> <li>List Item 1</li><li>List Item 2</li><li>List Item 3</li><li>List Item 4');
	expect(normalizedHtml).toContain('<a title="" rel="nofollow noopener noreferrer" target="_blank">Rocket.Chat</a>');
	expect(normalizedHtml).toContain('gabriel.engel@rocket.chat');
	expect(normalizedHtml).toContain('+55991999999');
	expect(normalizedHtml).toContain('<code>Inline code</code>');
	expect(normalizedHtml).toContain('<pre><code class="language-typescript">const test = \'this is code\' </code></pre>');
	expect(normalizedHtml).toContain('<strong>Bold text within <em>Italics</em></strong>');
	expect(normalizedHtml).toContain('<strong>Bold text with single asterik and underscore within <em>Italics</em></strong>');
	expect(normalizedHtml).toContain('<em>Italics within <strong>Bold</strong> text</em>');
	expect(normalizedHtml).toContain('<em>Italics within <strong>Bold</strong> text with single underscore and asterik</em>');
});

it('should render html elements as expected using inline parser', async () => {
	const { container } = render(<MarkdownText content={markdownText} variant='inline' />, {
		wrapper: mockAppRoot().build(),
	});

	const normalizedHtml = normalizeHtml(container.innerHTML);

	expect(normalizedHtml).toContain('# Heading 1');
	expect(normalizedHtml).toContain(
		'<strong>Bold with one asterisk</strong> <strong>Bold with two asterisks</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	);
	expect(normalizedHtml).toContain('## Heading 2');
	expect(normalizedHtml).toContain(
		'<em>Italic Text</em>: <em>Italic with one underscore</em> <em>Italic with two underscores</em> Lorem ipsum dolor sit amet',
	);
	expect(normalizedHtml).toContain('### Heading 3');
	expect(normalizedHtml).toContain('<strong>Unordered List</strong> - List Item 1 - List Item 2 - List Item 3 - List Item 4');
	expect(normalizedHtml).toContain('<strong>Ordered List</strong> 1. List Item 1 2. List Item 2 3. List Item 3 4. List Item 4');
	expect(normalizedHtml).toContain(`<a title=\"\" rel=\"nofollow noopener noreferrer\" target=\"_blank\">Rocket.Chat</a>`);
	expect(normalizedHtml).toContain(
		`<a href=\"mailto:gabriel.engel@rocket.chat\" title=\"mailto:gabriel.engel@rocket.chat\" rel=\"nofollow noopener noreferrer\" target=\"_blank\">gabriel.engel@rocket.chat</a>`,
	);
	expect(normalizedHtml).toContain('+55991999999');
	expect(normalizedHtml).toContain('Inline code');
	expect(normalizedHtml).toContain(`typescript const test = 'this is code'`);
	expect(normalizedHtml).toContain('<strong>Bold text within <em>Italics</em></strong>');
	expect(normalizedHtml).toContain('<strong>Bold text with single asterik and underscore within <em>Italics</em></strong>');
	expect(normalizedHtml).toContain('<em>Italics within <strong>Bold</strong> text</em>');
	expect(normalizedHtml).toContain('<em>Italics within <strong>Bold</strong> text with single underscore and asterik</em>');
});
