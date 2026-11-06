import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import FullscreenButton from './FullscreenButton';

const noop = () => undefined;

const meta = {
	component: FullscreenButton,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Fullscreen: 'Fullscreen',
				Exit_fullscreen: 'Exit fullscreen',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof FullscreenButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullscreenButtonStory: Story = {
	args: {
		fullscreen: false,
		onToggle: noop,
	},
	render: function Render() {
		const [fullscreen, setFullscreen] = useState(false);
		return <FullscreenButton fullscreen={fullscreen} onToggle={() => setFullscreen(!fullscreen)} />;
	},
};

export const Fullscreen: Story = {
	args: {
		fullscreen: true,
		onToggle: noop,
	},
};

export const Large: Story = {
	args: {
		fullscreen: false,
		size: 'large',
		onToggle: noop,
	},
};
