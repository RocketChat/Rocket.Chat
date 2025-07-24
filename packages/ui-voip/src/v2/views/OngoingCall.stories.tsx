import type { Meta, StoryFn } from '@storybook/react';

import OngoingCall from './OngoingCall';

export default {
	title: 'V2/Views/OngoingCall',
	component: OngoingCall,
	decorators: [(Story) => <Story />],
} satisfies Meta<typeof OngoingCall>;

export const OngoingCallStory: StoryFn<typeof OngoingCall> = () => {
	return <OngoingCall />;
};
