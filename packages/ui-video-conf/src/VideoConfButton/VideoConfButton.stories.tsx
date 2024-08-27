import type { ComponentMeta, ComponentStory } from '@storybook/react';

import VideoConfButton from './VideoConfButton';

export default {
	title: 'Components/VideoConfButton',
	component: VideoConfButton,
} satisfies ComponentMeta<typeof VideoConfButton>;

export const Default: ComponentStory<typeof VideoConfButton> = () => <VideoConfButton>Button</VideoConfButton>;
