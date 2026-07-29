import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import OngoingCall from './OngoingCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
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

export const OngoingCallStory: StoryObj<typeof OngoingCall> = {};

export const OngoingCallWithSlots: StoryObj<typeof OngoingCall> = {
	render: () => (
		<MockedMediaCallProvider muted={true} held={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	),
};

export const OngoingCallWithRemoteStatus: StoryObj<typeof OngoingCall> = {
	render: () => (
		<MockedMediaCallProvider remoteMuted={true} remoteHeld={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	),
};

export const OngoingCallWithRemoteStatusMuted: StoryObj<typeof OngoingCall> = {
	render: () => (
		<MockedMediaCallProvider remoteMuted={true} remoteHeld={false}>
			<OngoingCall />
		</MockedMediaCallProvider>
	),
};

export const OngoingCallWithRemoteStatusHeld: StoryObj<typeof OngoingCall> = {
	render: () => (
		<MockedMediaCallProvider remoteMuted={false} remoteHeld={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	),
};

export const OngoingCallWithSlotsAndRemoteStatus: StoryObj<typeof OngoingCall> = {
	render: () => (
		<MockedMediaCallProvider muted={true} held={true} remoteMuted={true} remoteHeld={true}>
			<OngoingCall />
		</MockedMediaCallProvider>
	),
};

export const OngoingCallWithDmButton: StoryObj<typeof OngoingCall> = {
	render: () => (
		<MockedMediaCallProvider onClickDirectMessage={() => undefined}>
			<OngoingCall />
		</MockedMediaCallProvider>
	),
};
