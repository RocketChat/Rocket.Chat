import type { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import ToggleButton from './ToggleButton';

export default {
	title: 'V2/Components/ToggleButton',
	component: ToggleButton,
} satisfies Meta<typeof ToggleButton>;

export const ToggleButtonStory: StoryFn<typeof ToggleButton> = () => {
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
};
