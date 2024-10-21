import type { Meta, StoryFn } from '@storybook/react';

import * as UserStatus from '.';
import { useAutoSequence } from '../../hooks/useAutoSequence';

export default {
	title: 'Components/UserStatus',
	component: UserStatus.UserStatus,
	subcomponents: {
		'UserStatus.Online': UserStatus.Online,
		'UserStatus.Away': UserStatus.Away,
		'UserStatus.Busy': UserStatus.Busy,
		'UserStatus.Offline': UserStatus.Offline,
	},
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof UserStatus.UserStatus>;

export const Example: StoryFn<typeof UserStatus.UserStatus> = () => {
	const status = useAutoSequence(['online', 'away', 'busy', 'offline'] as const);

	return <UserStatus.UserStatus status={status} />;
};

export const Loading: StoryFn<typeof UserStatus.Loading> = () => <UserStatus.Loading />;
export const Online: StoryFn<typeof UserStatus.Online> = () => <UserStatus.Online />;
export const Away: StoryFn<typeof UserStatus.Away> = () => <UserStatus.Away />;
export const Busy: StoryFn<typeof UserStatus.Busy> = () => <UserStatus.Busy />;
export const Offline: StoryFn<typeof UserStatus.Offline> = () => <UserStatus.Offline />;
