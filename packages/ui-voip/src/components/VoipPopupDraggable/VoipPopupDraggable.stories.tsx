import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import VoipPopupDraggable from './VoipPopupDraggable';
import { createMockVoipProviders } from '../../tests/mocks';

const [MockedProviders] = createMockVoipProviders();

export default {
	title: 'Voip/VoipPopupDraggable',
	component: VoipPopupDraggable,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<MockedProviders>
				<Box position='relative' width='100%' height='100vh' backgroundColor='#f1f2f4'>
					<Story />
				</Box>
			</MockedProviders>
		),
	],
} satisfies Meta<typeof VoipPopupDraggable>;

type Story = StoryObj<typeof VoipPopupDraggable>;

export const Default: Story = {
	args: {
		initialPosition: { top: 20, right: 20 },
	},
};

export const TopLeft: Story = {
	args: {
		initialPosition: { top: 20, left: 20 },
	},
};

export const BottomRight: Story = {
	args: {
		initialPosition: { bottom: 20, right: 20 },
	},
};

export const BottomLeft: Story = {
	args: {
		initialPosition: { bottom: 20, left: 20 },
	},
};
