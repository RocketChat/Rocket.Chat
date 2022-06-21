import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useContext, useEffect, useState } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type hljsResult = {
	language: string;
	code: string;
	value: string;
};

const isHljsResult = (result: any): result is hljsResult => result?.value;

type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const [code, setCode] = useState<(JSX.Element | null)[] | { language: string; code: string }>(() =>
		lines.map((block, index) => {
			switch (block.type) {
				case 'CODE_LINE':
					return <div key={index}>{block.value.type === 'PLAIN_TEXT' ? block.value.value : null}</div>;

				default:
					return null;
			}
		}),
	);

	const { hljs } = useContext(MarkupInteractionContext);

	useEffect(() => {
		!language || language === 'none'
			? setCode(hljs?.highlightAuto(lines.map((line) => line.value.value).join('\n')) ?? [])
			: hljs?.register(language).then(() => {
					setCode(hljs.highlight(language, lines.map((line) => line.value.value).join('\n')));
			  });
	}, [hljs, language, lines]);

	return (
		<code className={`code-colors hljs ${language}`}>
			<span className='copyonly'>
				\`\`\`
				<br />
			</span>
			{isHljsResult(code) ? <div dangerouslySetInnerHTML={{ __html: code.code || code.value }} /> : code}
			<span className='copyonly'>
				<br />
				\`\`\`
			</span>
		</code>
	);
};

export default CodeBlock;
