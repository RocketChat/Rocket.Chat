import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';

import * as UserStatus from '.';
import { useAutoSequence } from '../../hooks/useAutoSequence';

export default {
	component: UserStatus.UserStatus,
	subcomponents: {
		'UserStatus.Online': UserStatus.Online as ComponentType<any>,
		'UserStatus.Away': UserStatus.Away as ComponentType<any>,
		'UserStatus.Busy': UserStatus.Busy as ComponentType<any>,
		'UserStatus.Offline': UserStatus.Offline as ComponentType<any>,
	},
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof UserStatus.UserStatus>;

export const Example: StoryObj<typeof UserStatus.UserStatus> = {
	render: () => {
		const status = useAutoSequence(['online', 'away', 'busy', 'offline'] as const);

		return <UserStatus.UserStatus status={status} />;
	},
};

export const Loading: StoryObj<typeof UserStatus.Loading> = { render: () => <UserStatus.Loading /> };
export const Online: StoryObj<typeof UserStatus.Online> = { render: () => <UserStatus.Online /> };
export const Away: StoryObj<typeof UserStatus.Away> = { render: () => <UserStatus.Away /> };
export const Busy: StoryObj<typeof UserStatus.Busy> = { render: () => <UserStatus.Busy /> };
export const Offline: StoryObj<typeof UserStatus.Offline> = { render: () => <UserStatus.Offline /> };
