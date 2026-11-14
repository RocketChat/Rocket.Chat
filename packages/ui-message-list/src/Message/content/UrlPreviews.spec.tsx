import type { IMessage } from '@rocket.chat/core-typings';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import UrlPreviews from './UrlPreviews';
import * as stories from './UrlPreviews.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';

it('should show the metadata of a page as a link preview (R15)', () => {
	render(
		<UrlPreviews
			urls={[{ url: 'https://rocket.chat/blog', meta: { ogTitle: 'Release notes', ogDescription: 'What changed in this release' } }]}
		/>,
		{ wrapper: mockMessageProviders().wrapper },
	);

	expect(screen.getByText('Release notes')).toBeInTheDocument();
	expect(screen.getByText('What changed in this release')).toBeInTheDocument();
});

it('should resolve a relative preview image against the page origin (R15)', () => {
	const { container } = render(
		<UrlPreviews urls={[{ url: 'https://rocket.chat/blog/post', meta: { ogTitle: 'Post', ogImage: '/assets/cover.png' } }]} />,
		{ wrapper: mockMessageProviders().wrapper },
	);

	// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
	expect(container.querySelector('[style*="https://rocket.chat/assets/cover.png"]')).toBeInTheDocument();
});

it.each([
	[{ ogTitle: 'Post' }, 'Post'],
	[{}, 'https://rocket.chat/blog/post'],
])('should name the cover image link of a preview by the page title, or by its url without one: %j (R15)', (meta, name) => {
	render(<UrlPreviews urls={[{ url: 'https://rocket.chat/blog/post', meta: { ...meta, ogImage: '/assets/cover.png' } }]} />, {
		wrapper: mockMessageProviders().wrapper,
	});

	// oxlint-disable-next-line testing-library/no-node-access
	expect(screen.getAllByRole('link', { name }).some((link) => link.querySelector('[style*="cover.png"]'))).toBe(true);
});

it('should skip a url with neither metadata nor a media content type (R15)', () => {
	const { container } = render(<UrlPreviews urls={[{ url: 'https://example.com', meta: {}, headers: { contentType: 'text/html' } }]} />, {
		wrapper: mockMessageProviders().wrapper,
	});

	expect(container).toBeEmptyDOMElement();
});

it('should collapse a media preview on demand (R16)', async () => {
	render(<UrlPreviews urls={[{ url: 'https://example.com/cat.png', meta: {}, headers: { contentType: 'image/png' } }]} />, {
		wrapper: mockMessageProviders().wrapper,
	});

	expect(screen.getByRole('presentation')).toBeInTheDocument();

	await userEvent.click(screen.getByTitle('Collapse'));

	expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
});

describe('what a preview shows', () => {
	type Url = Required<IMessage>['urls'][0];

	const url = 'https://example.com/page';

	const renderPreviews = (urls: Partial<Url>[]) =>
		render(<UrlPreviews urls={urls.map((preview) => ({ url, ...preview }) as Url)} />, { wrapper: mockMessageProviders().wrapper });

	it('should show nothing for a URL with no metadata and no headers (R15)', () => {
		const { container } = renderPreviews([{}]);

		expect(container).toBeEmptyDOMElement();
	});

	it('should show the page title from the metadata (R15)', () => {
		renderPreviews([{ meta: { pageTitle: 'Page title' } }]);

		expect(screen.getByText('Page title')).toBeInTheDocument();
	});

	it.each([
		['Open Graph over Twitter', { ogTitle: 'Open Graph', twitterTitle: 'Twitter', pageTitle: 'Page' }, 'Open Graph'],
		['Twitter over the page title', { twitterTitle: 'Twitter', pageTitle: 'Page' }, 'Twitter'],
		['the title meta tag over the page title', { title: 'Meta', pageTitle: 'Page' }, 'Meta'],
		['oEmbed when it is the only title', { oembedTitle: 'oEmbed' }, 'oEmbed'],
	])('should prefer %s (R15)', (_order, meta, title) => {
		renderPreviews([{ meta }]);

		expect(screen.getByText(title)).toBeInTheDocument();
	});

	it('should link the title to the oEmbed URL over the page URL (R15)', () => {
		renderPreviews([{ meta: { ogTitle: 'Page title', oembedUrl: 'https://example.com/embed' } }]);

		expect(screen.getByRole('link', { name: 'Page title' })).toHaveAttribute('href', 'https://example.com/embed');
	});

	it.each([['twitterImage'], ['msapplicationTileImage'], ['oembedThumbnailUrl']])('should use %s as the cover image (R15)', (key) => {
		const { container } = renderPreviews([{ meta: { pageTitle: 'Page title', [key]: 'https://cdn.example/cover.png' } }]);

		expect(container.innerHTML).toContain('https://cdn.example/cover.png');
	});

	it('should prefer the Open Graph image (R15)', () => {
		const { container } = renderPreviews([
			{ meta: { pageTitle: 'Page title', ogImage: 'https://cdn.example/og.png', twitterImage: 'https://cdn.example/twitter.png' } },
		]);

		expect(container.innerHTML).toContain('https://cdn.example/og.png');
		expect(container.innerHTML).not.toContain('https://cdn.example/twitter.png');
	});

	it('should show the embedded content of a rich preview (R15)', () => {
		renderPreviews([{ meta: { pageTitle: 'Page title', oembedType: 'rich', oembedHtml: '<p>Embedded content</p>' } }]);

		expect(screen.getByText('Embedded content')).toBeInTheDocument();
	});

	it('should remove scripts from the embedded content and keep the frame (R15)', () => {
		const { container } = renderPreviews([
			{
				meta: {
					pageTitle: 'Page title',
					oembedType: 'video',
					oembedHtml: '<iframe src="https://video.example/1"></iframe><script>alert(1)</script><img src=x onerror="alert(1)">',
				},
			},
		]);

		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://video.example/1');
		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect(container.querySelector('script')).not.toBeInTheDocument();
		expect(container.innerHTML).not.toContain('onerror');
	});

	it('should prefer the Open Graph type over the oEmbed type (R15)', () => {
		renderPreviews([{ meta: { pageTitle: 'Page title', ogType: 'article', oembedType: 'rich', oembedHtml: '<p>Embedded content</p>' } }]);

		expect(screen.queryByText('Embedded content')).not.toBeInTheDocument();
	});

	it('should show the description (R15)', () => {
		renderPreviews([{ meta: { ogDescription: 'Page description' } }]);

		expect(screen.getByText('Page description')).toBeInTheDocument();
	});

	it('should link the site name to the site (R15)', () => {
		renderPreviews([{ meta: { ogSiteName: 'Example', ogUrl: 'https://example.com' } }]);

		// The app's markdown renderer, given through MarkdownTextContext, turns the markdown link into the link
		expect(screen.getByText('[Example](https://example.com)')).toBeInTheDocument();
	});

	it('should link the author name to the author (R15)', () => {
		renderPreviews([{ meta: { oembedAuthorName: 'Author', oembedAuthorUrl: 'https://example.com/author' } }]);

		// The app's markdown renderer, given through MarkdownTextContext, turns the markdown link into the link
		expect(screen.getByText('[Author](https://example.com/author)')).toBeInTheDocument();
	});

	it.each([
		['a site name with no site URL', { ogSiteName: 'Example' }],
		['a site URL with no site name', { ogUrl: 'https://example.com' }],
		['an author name with no author URL', { oembedAuthorName: 'Author' }],
		['an author URL with no author name', { oembedAuthorUrl: 'https://example.com/author' }],
	])('should show nothing for metadata with only %s (R15)', (_case, meta) => {
		const { container } = renderPreviews([{ meta }]);

		expect(container).toBeEmptyDOMElement();
	});

	it.each([
		['image/png', 'img'],
		['audio/mpeg', 'audio'],
		['video/mp4', 'video'],
	])('should show a media preview for the content type %s (R15)', (contentType, element) => {
		const { container } = renderPreviews([{ headers: { contentType } }]);

		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect(container.querySelector(element)).toBeInTheDocument();
	});

	it('should show nothing for a content type with no preview (R15)', () => {
		const { container } = renderPreviews([{ headers: { contentType: 'text/html' } }]);

		expect(container).toBeEmptyDOMElement();
	});

	it('should use the headers when the metadata has nothing to show (R15)', () => {
		const { container } = renderPreviews([{ meta: { ogType: 'website' }, headers: { contentType: 'image/png' } }]);

		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect(container.querySelector('img')).toBeInTheDocument();
	});

	it('should prefer the metadata over the headers (R15)', () => {
		const { container } = renderPreviews([{ meta: { ogTitle: 'Page title' }, headers: { contentType: 'image/png' } }]);

		expect(screen.getByText('Page title')).toBeInTheDocument();
		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect(container.querySelector('img')).not.toBeInTheDocument();
	});

	it('should show one preview for each URL with something to show (R15)', () => {
		renderPreviews([{ meta: { ogTitle: 'First' } }, {}, { meta: { ogTitle: 'Second' } }]);

		expect(screen.getByText('First')).toBeInTheDocument();
		expect(screen.getByText('Second')).toBeInTheDocument();
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R24)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
