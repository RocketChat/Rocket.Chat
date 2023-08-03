import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PasswordVerifier } from './PasswordVerifier';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// ✅ turns retries off
			retry: false,
		},
	},
});

export default {
	title: 'Components/PasswordVerifier',
	component: PasswordVerifier,
} as ComponentMeta<typeof PasswordVerifier>;

export const Default: ComponentStory<typeof PasswordVerifier> = (args) => (
	<QueryClientProvider client={queryClient}>
		<MockedServerContext
			handleRequest={(request) => {
				if (request.method === 'GET' && request.pathPattern === '/v1/pw.getPolicy') {
					return {
						enabled: true,
						policy: [['get-password-policy-minLength', { minLength: 10 }]],
					} as any;
				}
				throw new Error('Not implemented');
			}}
		>
			<PasswordVerifier {...args} />
		</MockedServerContext>
	</QueryClientProvider>
);

Default.storyName = 'PasswordVerifier';
Default.args = {
	password: 'asd',
};
