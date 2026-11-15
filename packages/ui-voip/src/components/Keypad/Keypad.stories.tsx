import type { Meta, StoryObj } from '@storybook/react';

import Keypad from './Keypad';
import { useTonePlayer } from '../../hooks/useTonePlayer';

export default {
	component: Keypad,
} satisfies Meta<typeof Keypad>;

export const KeypadStory: StoryObj<typeof Keypad> = {
	render: () => <Keypad onKeyPress={(key) => console.log(key)} />,
};

export const KeypadStoryWithTone: StoryObj<typeof Keypad> = {
	tags: ['skip'],
	render: () => {
		const playTone = useTonePlayer();
		return <Keypad onKeyPress={(key) => playTone(key as any)} />;
	},
};
