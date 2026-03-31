import type { Meta, StoryFn } from '@storybook/react';

import Keypad from './Keypad';
import { useTonePlayer } from '../../context/useTonePlayer';

export default {
	title: 'V2/Components/Keypad',
	component: Keypad,
} satisfies Meta<typeof Keypad>;

export const KeypadStory: StoryFn<typeof Keypad> = () => <Keypad onKeyPress={(key) => console.log(key)} />;
export const KeypadStoryWithTone: StoryFn<typeof Keypad> = () => {
	const playTone = useTonePlayer();
	return <Keypad onKeyPress={(key) => playTone(key as any)} />;
};
