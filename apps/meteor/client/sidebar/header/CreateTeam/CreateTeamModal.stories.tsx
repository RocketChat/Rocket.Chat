import type { Meta, StoryFn } from '@storybook/react';

import CreateTeamModal from './CreateTeamModal';
import CreateTeamModalV2 from '../../../NavBarV2/NavBarPagesGroup/actions/CreateTeamModal';

export default {
	component: CreateTeamModal,
} satisfies Meta<typeof CreateTeamModal>;

export const Default: StoryFn<typeof CreateTeamModal> = (args) => <CreateTeamModal {...args} />;
export const DefaultVersion2: StoryFn<typeof CreateTeamModalV2> = (args) => <CreateTeamModalV2 {...args} />;
