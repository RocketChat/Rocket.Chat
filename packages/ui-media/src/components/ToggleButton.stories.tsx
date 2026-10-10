import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import ToggleButton from './ToggleButton';

export default {
	component: ToggleButton,
} satisfies Meta<typeof ToggleButton>;

export const ToggleButtonStory: StoryObj<typeof ToggleButton> = {
	render: () => {
		const [pressed, setPressed] = useState(false);
		return (
			<ToggleButton
				label='Mute'
				titles={['Mute', 'Unmute']}
				icons={['mic', 'mic-off']}
				pressed={pressed}
				onToggle={() => setPressed(!pressed)}
			/>
		);
	},
};

/** Pressed, for something the user is doing rather than something they have turned off: the glyph goes blue. */
export const PressedInfo: StoryObj<typeof ToggleButton> = {
	args: {
		label: 'Raise hand',
		titles: ['Raise hand', 'Lower hand'],
		icons: ['hand', 'hand'],
		pressed: true,
		info: true,
	},
};
