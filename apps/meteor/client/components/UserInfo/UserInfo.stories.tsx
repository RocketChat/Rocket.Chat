import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import * as Status from '../UserStatus';
import VerticalBar from '../VerticalBar';
import UserInfo from './UserInfo';

export default {
	title: 'Room/Contextual Bar/UserInfo',
	component: UserInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof UserInfo>;

const Template: ComponentStory<typeof UserInfo> = (args) => <UserInfo {...args} />;

export const Default = Template.bind({});
Default.args = {
	name: 'Guilherme Gazzo',
	username: 'guilherme.gazzo',
	statusText: '🛴 currently working on User Card',
	bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tempus, eros convallis vulputate cursus, nisi neque eleifend libero, eget lacinia justo purus nec est. In at sodales ipsum. Sed lacinia quis purus eget pulvinar. Aenean eu pretium nunc, at aliquam magna. Praesent dignissim, tortor sed volutpat mattis, mauris diam pulvinar leo, porta commodo risus est non purus. Mauris in justo vel lorem ullamcorper hendrerit. Nam est metus, viverra a pellentesque vitae, ornare eget odio. Morbi tempor feugiat mattis. Morbi non felis tempor, aliquam justo sed, sagittis nibh. Mauris consequat ex metus. Praesent sodales sit amet nibh a vulputate. Integer commodo, mi vel bibendum sollicitudin, urna lectus accumsan ante, eget faucibus augue ex id neque. Aenean consectetur, orci a pellentesque mattis, tortor tellus fringilla elit, non ullamcorper risus nunc feugiat risus. Fusce sit amet nisi dapibus turpis commodo placerat. In tortor ante, vehicula sit amet augue et, imperdiet porta sem.',
	// actions: [<UserCard.Action icon='message'/>, <UserCard.Action icon='phone'/>],
	utcOffset: -3,
	email: 'rocketchat@rocket.chat',
	status: <Status.Offline />,
};

export const WithNickname = Template.bind({});
WithNickname.args = {
	name: 'Guilherme Gazzo',
	username: 'guilherme.gazzo',
	statusText: '🛴 currently working on User Card',
	bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tempus, eros convallis vulputate cursus, nisi neque eleifend libero, eget lacinia justo purus nec est. In at sodales ipsum. Sed lacinia quis purus eget pulvinar. Aenean eu pretium nunc, at aliquam magna. Praesent dignissim, tortor sed volutpat mattis, mauris diam pulvinar leo, porta commodo risus est non purus. Mauris in justo vel lorem ullamcorper hendrerit. Nam est metus, viverra a pellentesque vitae, ornare eget odio. Morbi tempor feugiat mattis. Morbi non felis tempor, aliquam justo sed, sagittis nibh. Mauris consequat ex metus. Praesent sodales sit amet nibh a vulputate. Integer commodo, mi vel bibendum sollicitudin, urna lectus accumsan ante, eget faucibus augue ex id neque. Aenean consectetur, orci a pellentesque mattis, tortor tellus fringilla elit, non ullamcorper risus nunc feugiat risus. Fusce sit amet nisi dapibus turpis commodo placerat. In tortor ante, vehicula sit amet augue et, imperdiet porta sem.',
	// actions: [<UserCard.Action icon='message'/>, <UserCard.Action icon='phone'/>],
	utcOffset: -3,
	email: 'rocketchat@rocket.chat',
	status: <Status.Offline />,
	nickname: 'Nickname',
};
