import { CodeSnippet } from '@rocket.chat/fuselage';

export const CodeDisplay = ({ code }: { code: string }) => {
	return <CodeSnippet mbs={8}>{code}</CodeSnippet>;
};
