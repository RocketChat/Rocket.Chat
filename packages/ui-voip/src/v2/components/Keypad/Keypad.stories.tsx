import type { Meta, StoryFn } from '@storybook/react';

import Keypad from './Keypad';

export default {
	title: 'V2/Components/Keypad',
	component: Keypad,
} satisfies Meta<typeof Keypad>;

export const KeypadStory: StoryFn<typeof Keypad> = () => <Keypad onKeyPress={(key) => console.log(key)} />;
