import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ScreenZoomButtons from './ScreenZoomButtons.js';

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

export const Unzoomed: Story = {
	args: { canZoomIn: true, canZoomOut: false, onZoomIn: noop, onZoomOut: noop },
};

export const Zoomed: Story = {
	args: { canZoomIn: true, canZoomOut: true, onZoomIn: noop, onZoomOut: noop },
};

export const FullyZoomedIn: Story = {
	args: { canZoomIn: false, canZoomOut: true, onZoomIn: noop, onZoomOut: noop },
};
