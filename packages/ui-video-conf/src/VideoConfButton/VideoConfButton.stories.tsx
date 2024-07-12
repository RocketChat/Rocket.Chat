import type { ComponentMeta, ComponentStory } from '@storybook/react';

import VideoConfButton from './VideoConfButton';

export default {
	title: 'Components/VideoConfButton',
	component: VideoConfButton,
} as ComponentMeta<typeof VideoConfButton>;

export const Default: ComponentStory<typeof VideoConfButton> = () => <VideoConfButton>Button</VideoConfButton>;
