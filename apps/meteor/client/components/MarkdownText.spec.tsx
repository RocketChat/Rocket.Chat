import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import MarkdownText from './MarkdownText';

import '@testing-library/jest-dom';

// Mock getBaseURI from @rocket.chat/ui-client to ensure consistent behavior in tests
// This will affect the isExternal function imported above.
jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'), // Import and retain default behavior for other exports
	getBaseURI: jest.fn(() => 'http://localhost/'), // Mock getBaseURI for consistent test behavior
}));

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
  \`2 < 3 > 1 & 4 "Test"\`
  \`\`\`typescript
  const test = 'this is code'
  \`\`\`
  \`\`\`
  Two < Three > One & Four "Test"
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

	expect(normalizedHtml).toContain('<a');
	expect(normalizedHtml).toContain('title=""');
	expect(normalizedHtml).toContain('rel="nofollow noopener noreferrer"');
	expect(normalizedHtml).toContain('target="_blank"');
	expect(normalizedHtml).toContain('>Rocket.Chat</a>');

	expect(normalizedHtml).toContain('href="mailto:gabriel.engel@rocket.chat"');
	expect(normalizedHtml).toContain('title="mailto:gabriel.engel@rocket.chat"');
	expect(normalizedHtml).toContain('gabriel.engel@rocket.chat');

	expect(normalizedHtml).toContain('+55991999999');
	expect(normalizedHtml).toContain('<code>Inline code</code>');
	expect(normalizedHtml).toContain('<pre><code class="language-typescript">const test = \'this is code\' </code></pre>');
	expect(normalizedHtml).toContain('<pre><code>Two &lt; Three &gt; One &amp; Four "Test" </code></pre>');
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

	expect(normalizedHtml).toContain('<a');
	expect(normalizedHtml).toContain('title=""');
	expect(normalizedHtml).toContain('rel="nofollow noopener noreferrer"');
	expect(normalizedHtml).toContain('target="_blank"');
	expect(normalizedHtml).toContain('>Rocket.Chat</a>');

	expect(normalizedHtml).toContain('href="mailto:gabriel.engel@rocket.chat"');
	expect(normalizedHtml).toContain('title="mailto:gabriel.engel@rocket.chat"');
	expect(normalizedHtml).toContain('rel="nofollow noopener noreferrer"');
	expect(normalizedHtml).toContain('target="_blank"');

	expect(normalizedHtml).toContain('+55991999999');
	expect(normalizedHtml).toContain('Inline code');
	expect(normalizedHtml).toContain(`typescript const test = 'this is code'`);
	expect(normalizedHtml).toContain('<strong>Bold text within <em>Italics</em></strong>');
	expect(normalizedHtml).toContain('<strong>Bold text with single asterik and underscore within <em>Italics</em></strong>');
	expect(normalizedHtml).toContain('<em>Italics within <strong>Bold</strong> text</em>');
	expect(normalizedHtml).toContain('<em>Italics within <strong>Bold</strong> text with single underscore and asterik</em>');
});

describe('links handling', () => {
	it.each([
		{
			caseName: 'transform external http',
			link: 'http://example.com',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'http://example.com',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform external https',
			link: 'https://example.com',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'https://example.com',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform notes',
			link: 'notes://example.com/path',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'notes://example.com/path',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform ftp',
			link: 'ftp://example.com/file.txt',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'ftp://example.com/file.txt',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform ftps',
			link: 'ftps://example.com/file.txt',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'ftps://example.com/file.txt',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform tel',
			link: 'tel:+1234567890',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'tel:+1234567890',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform mailto',
			link: 'mailto:test@example.com',
			query: () => screen.getByRole('link', { name: 'mailto:test@example.com' }),
			expectedHref: 'mailto:test@example.com',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: 'mailto:test@example.com',
		},
		{
			caseName: 'transform sms',
			link: 'sms:+1234567890?body=hello',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'sms:+1234567890?body=hello',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform cid',
			link: 'cid:someimage@example.com',
			query: () => screen.getByRole('link', { name: 'Test Link' }),
			expectedHref: 'cid:someimage@example.com',
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'filter relative',
			link: '/channel/general',
			query: () => screen.getByText('Test Link'),
			expectedHref: undefined,
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'transform absolute',
			link: 'http://localhost/another-channel',
			query: () => screen.getByRole('link', { name: 'Go to: another-channel' }),
			expectedHref: 'http://localhost/another-channel',
			expectedRel: undefined,
			expectedTarget: undefined,
			expectedTitleAttribute: 'Go to: another-channel',
		},
		{
			caseName: 'filter unknown scheme',
			link: 'invalid://example.com',
			query: () => screen.getByText('Test Link'),
			expectedHref: undefined,
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
		{
			caseName: 'filter javascript',
			link: "javascript:alert('XSS')",
			query: () => screen.getByText('Test Link'),
			expectedHref: undefined,
			expectedRel: 'nofollow noopener noreferrer',
			expectedTarget: '_blank',
			expectedTitleAttribute: '',
		},
	] as const)('should $caseName links', ({ link, query, expectedHref, expectedRel, expectedTarget, expectedTitleAttribute }) => {
		const markdownContent = `[Test Link](${link})`;
		render(<MarkdownText content={markdownContent} variant='document' />, {
			wrapper: mockAppRoot().withTranslations('en', 'core', { Go_to_href: 'Go to: {{href}}' }).build(),
		});

		const anchorElement = query();

		expect(anchorElement).toBeInTheDocument();
		expect(anchorElement.tagName).toBe('A');
		expect(anchorElement).toHaveTextContent('Test Link');

		if (expectedHref !== undefined) expect(anchorElement).toHaveAttribute('href', expectedHref);
		else expect(anchorElement).not.toHaveAttribute('href');

		if (expectedRel !== undefined) expect(anchorElement).toHaveAttribute('rel', expectedRel);
		else expect(anchorElement).not.toHaveAttribute('rel');

		if (expectedTarget !== undefined) expect(anchorElement).toHaveAttribute('target', expectedTarget);
		else expect(anchorElement).not.toHaveAttribute('target');

		if (expectedTitleAttribute !== undefined) expect(anchorElement).toHaveAttribute('title', expectedTitleAttribute);
		else expect(anchorElement).not.toHaveAttribute('title');
	});
});
