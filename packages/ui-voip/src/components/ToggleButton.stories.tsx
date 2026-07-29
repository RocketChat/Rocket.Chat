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
