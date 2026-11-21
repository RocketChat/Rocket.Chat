import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import ScreenZoomButtons from './ScreenZoomButtons';
import { MAX_ZOOM_SCALE, UNZOOMED, ZOOM_SCALE_STEP, zoomTo } from '../streams/screenZoom';

const noop = () => undefined;

const meta = {
	component: ScreenZoomButtons,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Zoom_in: 'Zoom in',
				Zoom_out: 'Zoom out',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof ScreenZoomButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ScreenZoomButtonsStory: Story = {
	args: {
		zoom: UNZOOMED,
		onZoomIn: noop,
		onZoomOut: noop,
	},
	render: function Render() {
		const [zoom, setZoom] = useState(UNZOOMED);
		return (
			<ScreenZoomButtons
				zoom={zoom}
				onZoomIn={() => setZoom((zoom) => zoomTo(zoom, zoom.scale + ZOOM_SCALE_STEP))}
				onZoomOut={() => setZoom((zoom) => zoomTo(zoom, zoom.scale - ZOOM_SCALE_STEP))}
			/>
		);
	},
};

export const Unzoomed: Story = {
	args: {
		zoom: UNZOOMED,
		onZoomIn: noop,
		onZoomOut: noop,
	},
};

export const FullyZoomedIn: Story = {
	args: {
		zoom: { ...UNZOOMED, scale: MAX_ZOOM_SCALE },
		onZoomIn: noop,
		onZoomOut: noop,
	},
};

export const Large: Story = {
	args: {
		zoom: { ...UNZOOMED, scale: 2 },
		size: 'large',
		onZoomIn: noop,
		onZoomOut: noop,
	},
};
