import type { AppScreenshot } from '@rocket.chat/core-typings';
import { ImageGalleryContext } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import ScreenshotCarouselAnchor from './ScreenshotCarouselAnchor';
import LazyImageGallery from '../../../components/LazyImageGallery';

const sampleImage = (label: string, fill: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="100%" height="100%" fill="${fill}"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="96" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`,
	)}`;

const screenshot = (index: number, fill: string): AppScreenshot => {
	const url = sampleImage(`Screenshot ${index}`, fill);
	return {
		id: `screenshot-${index}`,
		appId: 'sample-app',
		fileName: `screenshot-${index}.svg`,
		accessUrl: url,
		thumbnailUrl: url,
		createdAt: '2024-03-01T09:00:00.000Z',
		modifiedAt: '2024-03-01T09:00:00.000Z',
	};
};

export default {
	component: ScreenshotCarouselAnchor,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			<ImageGalleryContext.Provider value={LazyImageGallery}>
				<Story />
			</ImageGalleryContext.Provider>
		),
	],
	args: {
		screenshots: [screenshot(1, 'steelblue'), screenshot(2, 'seagreen'), screenshot(3, 'slategray')],
	},
} satisfies Meta<typeof ScreenshotCarouselAnchor>;

export const Default: StoryObj<typeof ScreenshotCarouselAnchor> = {};

export const SingleScreenshot: StoryObj<typeof ScreenshotCarouselAnchor> = {
	args: {
		screenshots: [screenshot(1, 'steelblue')],
	},
};
