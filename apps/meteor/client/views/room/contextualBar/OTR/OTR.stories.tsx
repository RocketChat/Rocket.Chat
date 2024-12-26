import type { Meta, StoryFn } from '@storybook/react';

import OTR from './OTR';
import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import { Contextualbar } from '../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/OTR',
	component: OTR,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof OTR>;

const Template: StoryFn<typeof OTR> = (args) => <OTR {...args} />;

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
