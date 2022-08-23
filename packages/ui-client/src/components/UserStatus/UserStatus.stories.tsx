import type { ComponentMeta, ComponentStory } from '@storybook/react';

import * as UserStatus from '.';
import { useAutoSequence } from '../../stories/hooks/useAutoSequence';

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
} as ComponentMeta<typeof UserStatus.UserStatus>;

export const Example: ComponentStory<typeof UserStatus.UserStatus> = () => {
	const status = useAutoSequence(['online', 'away', 'busy', 'offline'] as const);

	return <UserStatus.UserStatus status={status} />;
};

export const Loading: ComponentStory<typeof UserStatus.Loading> = () => <UserStatus.Loading />;
export const Online: ComponentStory<typeof UserStatus.Online> = () => <UserStatus.Online />;
export const Away: ComponentStory<typeof UserStatus.Away> = () => <UserStatus.Away />;
export const Busy: ComponentStory<typeof UserStatus.Busy> = () => <UserStatus.Busy />;
export const Offline: ComponentStory<typeof UserStatus.Offline> = () => <UserStatus.Offline />;
