import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import OngoingCall from './OngoingCall';
import { MockedMediaCallProvider } from '../../context';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
	title: 'V2/Views/OngoingCall',
	component: OngoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallStory: StoryFn<typeof OngoingCall> = () => <OngoingCall />;

export const OngoingCallWithSlots: StoryFn<typeof OngoingCall> = () => (
		<MockedMediaCallProvider muted={true} held={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	);

export const OngoingCallWithRemoteStatus: StoryFn<typeof OngoingCall> = () => (
		<MockedMediaCallProvider remoteMuted={true} remoteHeld={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	);

export const OngoingCallWithRemoteStatusMuted: StoryFn<typeof OngoingCall> = () => (
		<MockedMediaCallProvider remoteMuted={true} remoteHeld={false}>
			<OngoingCall />
		</MockedMediaCallProvider>
	);

export const OngoingCallWithRemoteStatusHeld: StoryFn<typeof OngoingCall> = () => (
		<MockedMediaCallProvider remoteMuted={false} remoteHeld={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	);

export const OngoingCallWithSlotsAndRemoteStatus: StoryFn<typeof OngoingCall> = () => (
		<MockedMediaCallProvider muted={true} held={true} remoteMuted={true} remoteHeld={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	);
