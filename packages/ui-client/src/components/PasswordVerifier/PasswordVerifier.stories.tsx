import { mockAppRoot } from '@rocket.chat/mock-providers';
// import { MockedServerContext } from '@rocket.chat/mock-providers/src/MockedServerContext';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PasswordVerifier } from './PasswordVerifier';

type Response = {
	enabled: boolean;
	policy: [
		name: string,
		value?:
			| {
					[x: string]: number;
			  }
			| undefined,
	][];
};

// const queryClient = new QueryClient({
// 	defaultOptions: {
// 		queries: {
// 			// ✅ turns retries off
// 			retry: false,
// 		},
// 	},
// });

export default {
	title: 'Components/PasswordVerifier',
	component: PasswordVerifier,
} as ComponentMeta<typeof PasswordVerifier>;

const response: Response = {
	enabled: true,
	policy: [
		['get-password-policy-minLength', { minLength: 10 }],
		['get-password-policy-forbidRepeatingCharactersCount', { maxRepeatingChars: 3 }],
		['get-password-policy-mustContainAtLeastOneLowercase'],
		['get-password-policy-mustContainAtLeastOneUppercase'],
		['get-password-policy-mustContainAtLeastOneNumber'],
		['get-password-policy-mustContainAtLeastOneSpecialCharacter'],
	],
};

const Wrapper = mockAppRoot()
	.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
	.build();

export const Default: ComponentStory<typeof PasswordVerifier> = (args) => (
	<Wrapper>
		<PasswordVerifier {...args} />
	</Wrapper>
);

Default.storyName = 'PasswordVerifier';
Default.args = {
	password: 'asd',
};
