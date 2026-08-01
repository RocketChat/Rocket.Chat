import type { Meta, StoryFn } from '@storybook/react';

import CallLeftScreen from './CallLeftScreen';

export default {
	title: 'V2/Views/CallLeftScreen',
	component: CallLeftScreen,
	decorators: [
		(Story) => (
			<div style={{ width: '62rem', height: '33.5rem', display: 'flex' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof CallLeftScreen>;

export const WithParticipants: StoryFn<typeof CallLeftScreen> = () => (
	<CallLeftScreen participantCount={2} autoCloseSeconds={3600} onRejoin={console.log} onClose={console.log} />
);

export const Empty: StoryFn<typeof CallLeftScreen> = () => (
	<CallLeftScreen participantCount={0} autoCloseSeconds={3600} onRejoin={console.log} onClose={console.log} />
);
