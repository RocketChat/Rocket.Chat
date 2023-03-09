import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import VerticalBar from '../../../../components/VerticalBar';
import OTR from './OTR';

export default {
	title: 'Room/Contextual Bar/OTR',
	component: OTR,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof OTR>;

const Template: ComponentStory<typeof OTR> = (args) => <OTR {...args} />;

export const Default = Template.bind({});
Default.args = {
	isOnline: true,
	otrState: OtrRoomState.NOT_STARTED,
};

export const Establishing = Template.bind({});
Establishing.args = {
	isOnline: true,
	otrState: OtrRoomState.ESTABLISHING,
};

export const Established = Template.bind({});
Established.args = {
	isOnline: true,
	otrState: OtrRoomState.ESTABLISHED,
};

export const Unavailable = Template.bind({});
Unavailable.args = {
	isOnline: false,
};

export const Timeout = Template.bind({});
Timeout.args = {
	isOnline: true,
	otrState: OtrRoomState.TIMEOUT,
	peerUsername: 'testUser',
};

export const Declined = Template.bind({});
Declined.args = {
	isOnline: true,
	otrState: OtrRoomState.DECLINED,
	peerUsername: 'testUser',
};
