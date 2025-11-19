import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import OngoingCall from './OngoingCall';
import MediaCallProviderMock from '../MockedMediaCallProvider';

const mockedContexts = mockAppRoot().buildStoryDecorator();

export default {
	title: 'V2/Views/OngoingCall',
	component: OngoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MediaCallProviderMock>
				<Story />
			</MediaCallProviderMock>
		),
	],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallStory: StoryFn<typeof OngoingCall> = () => {
	return <OngoingCall />;
};

export const OngoingCallWithSlots: StoryFn<typeof OngoingCall> = () => {
	return (
		<MediaCallProviderMock muted={true} held={true}>
			<OngoingCall />
		</MediaCallProviderMock>
	);
};

export const OngoingCallWithRemoteStatus: StoryFn<typeof OngoingCall> = () => {
	return (
		<MediaCallProviderMock remoteMuted={true} remoteHeld={true}>
			<OngoingCall />
		</MediaCallProviderMock>
	);
};

export const OngoingCallWithRemoteStatusMuted: StoryFn<typeof OngoingCall> = () => {
	return (
		<MediaCallProviderMock remoteMuted={true} remoteHeld={false}>
			<OngoingCall />
		</MediaCallProviderMock>
	);
};

export const OngoingCallWithRemoteStatusHeld: StoryFn<typeof OngoingCall> = () => {
	return (
		<MediaCallProviderMock remoteMuted={false} remoteHeld={true}>
			<OngoingCall />
		</MediaCallProviderMock>
	);
};

export const OngoingCallWithSlotsAndRemoteStatus: StoryFn<typeof OngoingCall> = () => {
	return (
		<MediaCallProviderMock muted={true} held={true} remoteMuted={true} remoteHeld={true}>
			<OngoingCall />
		</MediaCallProviderMock>
	);
};
