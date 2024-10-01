import { Box } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ReactElement } from 'react';

import VoipDialPad from './VoipDialPad';

export default {
	title: 'Components/VoipDialPad',
	component: VoipDialPad,
	decorators: [
		(Story): ReactElement => (
			<Box maxWidth={248}>
				<Story />
			</Box>
		),
	],
} satisfies ComponentMeta<typeof VoipDialPad>;

export const DialPad: ComponentStory<typeof VoipDialPad> = () => {
	return <VoipDialPad value='' onChange={() => undefined} />;
};
