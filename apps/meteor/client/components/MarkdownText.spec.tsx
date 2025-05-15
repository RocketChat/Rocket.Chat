import { mockAppRoot } from '@rocket.chat/mock-providers';
import { isExternal } from '@rocket.chat/ui-client';
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

describe('MarkdownText scheme handling', () => {
	const schemesData = [
		{ schemeName: 'http-ext', link: 'http://example.com' },
		{ schemeName: 'https-ext', link: 'https://example.com' },
		{ schemeName: 'notes', link: 'notes://example.com/path' },
		{ schemeName: 'ftp', link: 'ftp://example.com/file.txt' },
		{ schemeName: 'ftps', link: 'ftps://example.com/file.txt' },
		{ schemeName: 'tel', link: 'tel:+1234567890' },
		{ schemeName: 'mailto', link: 'mailto:test@example.com', explicitTitle: 'mailto:test@example.com' },
		{ schemeName: 'sms', link: 'sms:+1234567890?body=hello' },
		{ schemeName: 'cid', link: 'cid:someimage@example.com' },
		{ schemeName: 'internal-relative', link: '/channel/general', isRemoved: true },
		{ schemeName: 'internal-absolute', link: 'http://localhost/another-channel' },
		{ schemeName: 'invalid-scheme', link: 'invalid://example.com', isRemoved: true },
		{ schemeName: 'javascript-uri', link: "javascript:alert('XSS')", isRemoved: true },
	];

	const testCases = schemesData.map(({ schemeName, link, explicitTitle, isRemoved }) => {
		const isActuallyExternal = isExternal(link);

		let expectedTitleAttr: string | undefined = explicitTitle;
		if (expectedTitleAttr === undefined) {
			if (isRemoved) {
				expectedTitleAttr = '';
			} else if (isActuallyExternal) {
				expectedTitleAttr = '';
			} else {
				expectedTitleAttr = 'Go_to_href';
			}
		}

		const shouldHaveExternalRelTarget = isRemoved || isActuallyExternal || link.startsWith('mailto:');

		let queryStrategy: { method: 'getByRole'; name: string | RegExp } | { method: 'getByText'; text: string | RegExp };

		if (expectedTitleAttr && expectedTitleAttr !== '') {
			queryStrategy = { method: 'getByRole', name: expectedTitleAttr };
		} else if (link.startsWith('mailto:') && !expectedTitleAttr) {
			queryStrategy = { method: 'getByRole', name: link };
		} else {
			// For links with empty titles or no specific title attribute, target by text content.
			queryStrategy = { method: 'getByText', text: 'Test Link' };
		}

		return {
			schemeName,
			link,
			isRemoved: Boolean(isRemoved),
			isActuallyExternal,
			expectedHref: link,
			expectedRel: shouldHaveExternalRelTarget ? 'nofollow noopener noreferrer' : undefined,
			expectedTarget: shouldHaveExternalRelTarget ? '_blank' : undefined,
			expectedTitleAttribute: expectedTitleAttr,
			queryStrategy,
		};
	});

	testCases.forEach((tc) => {
		it(`should ${tc.isRemoved ? 'handle' : 'correctly process'} ${tc.schemeName} links (isExternal returned: ${tc.isActuallyExternal})`, () => {
			const markdownContent = `[Test Link](${tc.link})`;
			render(<MarkdownText content={markdownContent} variant='document' />, {
				wrapper: mockAppRoot().build(),
			});

			let anchorElement: HTMLElement;
			if (tc.queryStrategy.method === 'getByRole') {
				anchorElement = screen.getByRole('link', { name: tc.queryStrategy.name });
			} else {
				// tc.queryStrategy.method === 'getByText'
				const elementWithText = screen.getByText(tc.queryStrategy.text);
				if (elementWithText.tagName === 'A') {
					anchorElement = elementWithText;
				} else {
					const parentAnchor = elementWithText.closest('a');
					if (!parentAnchor) {
						// This case should ideally not happen if markdown `[Text](link)` is parsed correctly to an anchor.
						// If it does, it indicates a deeper issue or a test case where text isn't in an anchor.
						throw new Error(`Query by text found "${tc.queryStrategy.text}", but it is not within an anchor tag.`);
					}
					anchorElement = parentAnchor;
				}
			}

			expect(anchorElement).toBeInTheDocument();
			expect(anchorElement.tagName).toBe('A');

			// Assert href
			if (tc.isRemoved) {
				// eslint-disable-next-line testing-library/no-node-access -- Need to check href value against multiple possibilities for sanitized links
				const currentHref = anchorElement.getAttribute('href');
				if (tc.link.startsWith('javascript:')) {
					// For JS links, ensure href is neutralized (null, '#', or non-JS)
					expect(
						currentHref === null || // Stripped completely
							currentHref === '#' || // Commonly neutralized to #
							!currentHref.startsWith('javascript:'), // Original but non-functional due to other attributes or browser measures
					).toBe(true);
				} else if (tc.schemeName === 'internal-relative') {
					// Internal relative links are expected to have their href attribute removed by DOMPurify
					expect(anchorElement).not.toHaveAttribute('href');
				} else {
					// For other removed links (e.g., invalid-scheme), href might be original, '#', or null.
					expect(
						currentHref === tc.link || // Left as is
							currentHref === '#' || // Neutralized to #
							currentHref === null, // Stripped
					).toBe(true);
				}
			} else {
				expect(anchorElement).toHaveAttribute('href', tc.expectedHref);
			}

			// Assert rel
			if (tc.expectedRel) {
				expect(anchorElement).toHaveAttribute('rel', tc.expectedRel);
			} else {
				expect(anchorElement).not.toHaveAttribute('rel');
			}

			// Assert target
			if (tc.expectedTarget) {
				expect(anchorElement).toHaveAttribute('target', tc.expectedTarget);
			} else {
				expect(anchorElement).not.toHaveAttribute('target');
			}

			// Assert title - tc.expectedTitleAttribute is always a string ('' or a specific title)
			expect(anchorElement).toHaveAttribute('title', tc.expectedTitleAttribute);

			expect(anchorElement).toHaveTextContent('Test Link');
		});
	});
});
