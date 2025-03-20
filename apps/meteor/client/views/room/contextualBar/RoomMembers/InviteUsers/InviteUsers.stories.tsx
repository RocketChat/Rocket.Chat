import type { Meta, StoryFn } from '@storybook/react';

import InviteUsers from './InviteUsers';
import { Contextualbar } from '../../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/RoomMembers/InviteUsers',
	component: InviteUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof InviteUsers>;

export const Default: StoryFn<typeof InviteUsers> = (args) => <InviteUsers {...args} />;
Default.storyName = 'InviteUsers';
Default.args = {
	linkText: 'https://go.rocket.chat/invite?host=open.rocket.chat&path=invite%2F5sBs3a',
	captionText: 'Expire on February 4, 2020 4:45 PM.',
};
