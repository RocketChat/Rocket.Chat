import type { Meta, StoryFn } from '@storybook/react';

import OngoingCall from './OngoingCall';
import MediaCallProviderMock from '../MockedMediaCallProvider';

export default {
	title: 'V2/Views/OngoingCall',
	component: OngoingCall,
	decorators: [
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
