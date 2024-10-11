import { Box } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

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
} satisfies ComponentMeta<typeof VoipContactId>;

export const Loading: ComponentStory<typeof VoipContactId> = () => {
	return <VoipContactId name='1000' isLoading />;
};

export const WithUsername: ComponentStory<typeof VoipContactId> = () => {
	return <VoipContactId username='john.doe' name='John Doe' />;
};

export const WithTransfer: ComponentStory<typeof VoipContactId> = () => {
	return <VoipContactId username='john.doe' transferedBy='Jane Doe' name='John Doe' />;
};

export const WithPhoneNumber: ComponentStory<typeof VoipContactId> = () => {
	return <VoipContactId name='+554788765522' />;
};
