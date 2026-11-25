import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { useId, useState } from 'react';

import ZoomableScreen from './ZoomableScreen.js';
import { UNZOOMED } from './screenZoom.js';
import { useScreenZoom } from './useScreenZoom.js';
import FullscreenButton from '../components/FullscreenButton.js';
import ScreenZoomButtons from '../components/ScreenZoomButtons.js';
import { useFullscreenToggle } from '../fullscreen/useFullscreenToggle.js';

// A labelled grid stands in for a shared screen, so zooming and moving around it can be seen.
const createScreenStream = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 1280;
	canvas.height = 720;
	const context = canvas.getContext('2d');
	const stream = canvas.captureStream();

	if (context) {
		context.fillStyle = '#2b66be';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.strokeStyle = '#182332';
		context.fillStyle = '#e4e7ea';
		context.font = '24px sans-serif';
		for (let column = 0; column < 8; column++) {
			for (let row = 0; row < 6; row++) {
				context.strokeRect(column * 160, row * 120, 160, 120);
				context.fillText(`${String.fromCharCode(65 + column)}${row + 1}`, column * 160 + 16, row * 120 + 40);
			}
		}
	}

	return stream;
};

const noop = () => undefined;

const useScreenStream = () => useState(createScreenStream)[0];

const meta = {
	component: ZoomableScreen,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Zoom_in: 'Zoom in',
				Zoom_out: 'Zoom out',
				Fullscreen: 'Fullscreen',
				Exit_fullscreen: 'Exit fullscreen',
				Zoom_level_percent: 'Zoom {{percent}}%',
				Screen_share_zoomed_hint: 'Drag, or use the arrow keys, to move around the zoomed screen',
			})
			.buildStoryDecorator(),
		(Story) => (
			<Box width={640} height={360}>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof ZoomableScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The screen with the zoom and fullscreen controls over it, the way a viewer puts them together. */
export const WithControls: Story = {
	args: {
		'stream': new MediaStream(),
		'zoom': UNZOOMED,
		'onZoomChange': noop,
		'aria-labelledby': 'screen-label',
	},
	render: function Render() {
		const stream = useScreenStream();
		const labelId = useId();
		const { fullscreen, enabled, toggleFullscreen, targetRef } = useFullscreenToggle();
		const { zoom, changeZoom, zoomIn, zoomOut, canZoomIn, canZoomOut } = useScreenZoom(stream.id);

		return (
			<Box
				ref={targetRef}
				position='relative'
				display='flex'
				width='full'
				height='full'
				overflow='hidden'
				backgroundColor='surface-neutral'
			>
				<ZoomableScreen stream={stream} zoom={zoom} onZoomChange={changeZoom} aria-labelledby={labelId} />
				<Box id={labelId} position='absolute' insetBlockStart={8} insetInlineStart={8} fontScale='c1' color='pure-white'>
					Ada Lovelace — screen
				</Box>
				<Box position='absolute' insetBlockEnd={8} insetInlineEnd={8}>
					<ButtonGroup>
						<ScreenZoomButtons canZoomIn={canZoomIn} canZoomOut={canZoomOut} onZoomIn={zoomIn} onZoomOut={zoomOut} />
						{enabled && <FullscreenButton fullscreen={fullscreen} onToggle={toggleFullscreen} />}
					</ButtonGroup>
				</Box>
			</Box>
		);
	},
};

/** Zoomed in and moved towards the top left corner; it takes focus, for the arrow keys. */
export const Zoomed: Story = {
	args: {
		'stream': new MediaStream(),
		'zoom': { scale: 2, x: 0.3, y: 0.2 },
		'onZoomChange': noop,
		'aria-labelledby': 'screen-label',
	},
	render: function Render(args) {
		const stream = useScreenStream();
		return (
			<Box position='relative' display='flex' width='full' height='full' overflow='hidden' backgroundColor='surface-neutral'>
				<ZoomableScreen {...args} stream={stream} />
				<Box id='screen-label' position='absolute' insetBlockStart={8} insetInlineStart={8} fontScale='c1' color='pure-white'>
					Ada Lovelace — screen
				</Box>
			</Box>
		);
	},
};
