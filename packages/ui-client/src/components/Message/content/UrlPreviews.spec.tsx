import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import UrlPreviews from './UrlPreviews';
import * as stories from './UrlPreviews.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

it('should show the metadata of a page as a link preview', () => {
	render(
		<UrlPreviews
			urls={[{ url: 'https://rocket.chat/blog', meta: { ogTitle: 'Release notes', ogDescription: 'What changed in this release' } }]}
		/>,
		{ wrapper: mockMessageProviders().wrapper },
	);

	expect(screen.getByText('Release notes')).toBeInTheDocument();
	expect(screen.getByText('What changed in this release')).toBeInTheDocument();
});

it('should resolve a relative preview image against the page origin', () => {
	const { container } = render(
		<UrlPreviews urls={[{ url: 'https://rocket.chat/blog/post', meta: { ogTitle: 'Post', ogImage: '/assets/cover.png' } }]} />,
		{ wrapper: mockMessageProviders().wrapper },
	);

	// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
	expect(container.querySelector('[style*="https://rocket.chat/assets/cover.png"]')).toBeInTheDocument();
});

it('should skip a url with neither metadata nor a media content type', () => {
	const { container } = render(<UrlPreviews urls={[{ url: 'https://example.com', meta: {}, headers: { contentType: 'text/html' } }]} />, {
		wrapper: mockMessageProviders().wrapper,
	});

	expect(container).toBeEmptyDOMElement();
});

it('should collapse a media preview on demand', async () => {
	render(<UrlPreviews urls={[{ url: 'https://example.com/cat.png', meta: {}, headers: { contentType: 'image/png' } }]} />, {
		wrapper: mockMessageProviders().wrapper,
	});

	expect(screen.getByRole('presentation')).toBeInTheDocument();

	await userEvent.click(screen.getByTitle('Collapse'));

	expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
