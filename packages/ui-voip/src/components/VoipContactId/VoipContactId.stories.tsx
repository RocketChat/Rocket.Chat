import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import VoipContactId from './VoipContactId';

export default {
	title: 'Components/VoipContactId',
	component: VoipContactId,
	decorators: [
		(Story): ReactElement => (
			<QueryClientProvider client={new QueryClient()}>
				<Box maxWidth={200}>
					<Story />
				</Box>
			</QueryClientProvider>
		),
	],
} satisfies Meta<typeof VoipContactId>;

export const Loading: StoryFn<typeof VoipContactId> = () => {
	return <VoipContactId name='1000' isLoading />;
};

export const WithUsername: StoryFn<typeof VoipContactId> = () => {
	return <VoipContactId username='john.doe' name='John Doe' />;
};

export const WithTransfer: StoryFn<typeof VoipContactId> = () => {
	return <VoipContactId username='john.doe' transferedBy='Jane Doe' name='John Doe' />;
};

export const WithPhoneNumber: StoryFn<typeof VoipContactId> = () => {
	return <VoipContactId name='+554788765522' />;
};
