import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import UrlPreviews from './UrlPreviews';

const image = `data:image/svg+xml;utf8,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="368" height="192"><rect width="368" height="192" fill="#9ea2a8"/></svg>',
)}`;

const meta = {
	title: 'Components/Message/Content/UrlPreviews',
	component: UrlPreviews,
	decorators: [mockAppRoot().withTranslations('en', 'core', { Link_Preview: 'Link preview' }).buildStoryDecorator()],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof UrlPreviews>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OEmbedLink: Story = {
	args: {
		urls: [
			{
				url: 'https://rocket.chat/blog/release',
				meta: {
					ogTitle: 'Rocket.Chat 7.0 is here',
					ogDescription: 'A faster message list, new threads and more.',
					ogSiteName: 'Rocket.Chat',
					ogUrl: 'https://rocket.chat',
					ogImage: image,
				},
			},
		],
	},
};

export const OEmbedPhoto: Story = {
	args: {
		urls: [
			{
				url: 'https://example.com/photo',
				meta: { oembedType: 'photo', oembedTitle: 'A grey rectangle', oembedThumbnailUrl: image },
			},
		],
	},
};

export const OEmbedRich: Story = {
	args: {
		urls: [
			{
				url: 'https://example.com/embed',
				meta: {
					oembedType: 'rich',
					oembedTitle: 'An embedded widget',
					oembedHtml: '<p>Embedded content</p>',
				},
			},
		],
	},
};

export const ImageByHeaders: Story = {
	args: { urls: [{ url: image, meta: {}, headers: { contentType: 'image/svg+xml' } }] },
};

export const AudioByHeaders: Story = {
	args: { urls: [{ url: 'https://example.com/sound.mp3', meta: {}, headers: { contentType: 'audio/mpeg' } }] },
};

export const VideoByHeaders: Story = {
	args: { urls: [{ url: 'https://example.com/clip.mp4', meta: {}, headers: { contentType: 'video/mp4' } }] },
};
