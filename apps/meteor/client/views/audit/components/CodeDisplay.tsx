import { CodeSnippet } from '@rocket.chat/fuselage';

export const CodeDisplay = ({ code }: { code: string }) => {
	return (
		<CodeSnippet aria-label='code_setting' mbs={8}>
			{code}
		</CodeSnippet>
	);
};
