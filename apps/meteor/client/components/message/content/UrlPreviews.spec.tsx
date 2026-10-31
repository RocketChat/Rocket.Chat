import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import UrlPreviews from './UrlPreviews';

type Url = Required<IMessage>['urls'][0];

const url = 'https://example.com/page';

const renderPreviews = (urls: Partial<Url>[]) =>
	render(<UrlPreviews urls={urls.map((preview) => ({ url, ...preview }) as Url)} />, {
		wrapper: mockAppRoot().build(),
	});

describe('UrlPreviews', () => {
	it('should show nothing for a URL with no metadata and no headers', () => {
		const { container } = renderPreviews([{}]);

		expect(container).toBeEmptyDOMElement();
	});

	it('should show the page title from the metadata', () => {
		renderPreviews([{ meta: { pageTitle: 'Page title' } }]);

		expect(screen.getByText('Page title')).toBeInTheDocument();
	});

	it.each([
		['Open Graph over Twitter', { ogTitle: 'Open Graph', twitterTitle: 'Twitter', pageTitle: 'Page' }, 'Open Graph'],
		['Twitter over the page title', { twitterTitle: 'Twitter', pageTitle: 'Page' }, 'Twitter'],
		['the title meta tag over the page title', { title: 'Meta', pageTitle: 'Page' }, 'Meta'],
		['oEmbed when it is the only title', { oembedTitle: 'oEmbed' }, 'oEmbed'],
	])('should prefer %s', (_order, meta, title) => {
		renderPreviews([{ meta }]);

		expect(screen.getByText(title)).toBeInTheDocument();
	});

	it('should link the title to the oEmbed URL over the page URL', () => {
		renderPreviews([{ meta: { ogTitle: 'Page title', oembedUrl: 'https://example.com/embed' } }]);

		expect(screen.getByRole('link', { name: 'Page title' })).toHaveAttribute('href', 'https://example.com/embed');
	});

	it.each([['twitterImage'], ['msapplicationTileImage'], ['oembedThumbnailUrl']])('should use %s as the cover image', (key) => {
		const { container } = renderPreviews([{ meta: { pageTitle: 'Page title', [key]: 'https://cdn.example/cover.png' } }]);

		expect(container.innerHTML).toContain('https://cdn.example/cover.png');
	});

	it('should prefer the Open Graph image', () => {
		const { container } = renderPreviews([
			{ meta: { pageTitle: 'Page title', ogImage: 'https://cdn.example/og.png', twitterImage: 'https://cdn.example/twitter.png' } },
		]);

		expect(container.innerHTML).toContain('https://cdn.example/og.png');
		expect(container.innerHTML).not.toContain('https://cdn.example/twitter.png');
	});

	it('should show the embedded content of a rich preview', () => {
		renderPreviews([{ meta: { pageTitle: 'Page title', oembedType: 'rich', oembedHtml: '<p>Embedded content</p>' } }]);

		expect(screen.getByText('Embedded content')).toBeInTheDocument();
	});

	it('should remove scripts from the embedded content and keep the frame', () => {
		const { container } = renderPreviews([
			{
				meta: {
					pageTitle: 'Page title',
					oembedType: 'video',
					oembedHtml: '<iframe src="https://video.example/1"></iframe><script>alert(1)</script><img src=x onerror="alert(1)">',
				},
			},
		]);

		expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://video.example/1');
		expect(container.querySelector('script')).not.toBeInTheDocument();
		expect(container.innerHTML).not.toContain('onerror');
	});

	it('should prefer the Open Graph type over the oEmbed type', () => {
		renderPreviews([{ meta: { pageTitle: 'Page title', ogType: 'article', oembedType: 'rich', oembedHtml: '<p>Embedded content</p>' } }]);

		expect(screen.queryByText('Embedded content')).not.toBeInTheDocument();
	});

	it('should show the description', () => {
		renderPreviews([{ meta: { ogDescription: 'Page description' } }]);

		expect(screen.getByText('Page description')).toBeInTheDocument();
	});

	it('should link the site name to the site', () => {
		renderPreviews([{ meta: { ogSiteName: 'Example', ogUrl: 'https://example.com' } }]);

		expect(screen.getByRole('link', { name: 'Example' })).toHaveAttribute('href', 'https://example.com');
	});

	it('should link the author name to the author', () => {
		renderPreviews([{ meta: { oembedAuthorName: 'Author', oembedAuthorUrl: 'https://example.com/author' } }]);

		expect(screen.getByRole('link', { name: 'Author' })).toHaveAttribute('href', 'https://example.com/author');
	});

	it.each([
		['a site name with no site URL', { ogSiteName: 'Example' }],
		['a site URL with no site name', { ogUrl: 'https://example.com' }],
		['an author name with no author URL', { oembedAuthorName: 'Author' }],
		['an author URL with no author name', { oembedAuthorUrl: 'https://example.com/author' }],
	])('should show nothing for metadata with only %s', (_case, meta) => {
		const { container } = renderPreviews([{ meta }]);

		expect(container).toBeEmptyDOMElement();
	});

	it.each([
		['image/png', 'img'],
		['audio/mpeg', 'audio'],
		['video/mp4', 'video'],
	])('should show a media preview for the content type %s', (contentType, element) => {
		const { container } = renderPreviews([{ headers: { contentType } }]);

		expect(container.querySelector(element)).toBeInTheDocument();
	});

	it('should show nothing for a content type with no preview', () => {
		const { container } = renderPreviews([{ headers: { contentType: 'text/html' } }]);

		expect(container).toBeEmptyDOMElement();
	});

	it('should use the headers when the metadata has nothing to show', () => {
		const { container } = renderPreviews([{ meta: { ogType: 'website' }, headers: { contentType: 'image/png' } }]);

		expect(container.querySelector('img')).toBeInTheDocument();
	});

	it('should prefer the metadata over the headers', () => {
		const { container } = renderPreviews([{ meta: { ogTitle: 'Page title' }, headers: { contentType: 'image/png' } }]);

		expect(screen.getByText('Page title')).toBeInTheDocument();
		expect(container.querySelector('img')).not.toBeInTheDocument();
	});

	it('should show one preview for each URL with something to show', () => {
		renderPreviews([{ meta: { ogTitle: 'First' } }, {}, { meta: { ogTitle: 'Second' } }]);

		expect(screen.getByText('First')).toBeInTheDocument();
		expect(screen.getByText('Second')).toBeInTheDocument();
	});
});
