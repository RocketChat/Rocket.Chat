import type { StoryObj, Meta } from '@storybook/react';

import ForwardChatModal from './ForwardChatModal';
import { createFakeOmnichannelRoom } from '../../../../tests/mocks/data';

const mockedRoom = createFakeOmnichannelRoom();

export default {
	component: ForwardChatModal,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		room: mockedRoom,
	},
} satisfies Meta<typeof ForwardChatModal>;

export const Default: StoryObj<typeof ForwardChatModal> = {};
