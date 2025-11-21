import type { Meta, StoryFn } from '@storybook/react';

import CreateChanelModal from './CreateChannelModal';
import CreateChannelModalV2 from '../../../NavBarV2/NavBarPagesGroup/actions/CreateChannelModal';

export default {
	component: CreateChanelModal,
} satisfies Meta<typeof CreateChanelModal>;

export const Default: StoryFn<typeof CreateChanelModal> = (args) => <CreateChanelModal {...args} />;
export const DefaultVersion2: StoryFn<typeof CreateChannelModalV2> = (args) => <CreateChannelModalV2 {...args} />;
