import type * as MessageParser from '@rocket.chat/message-parser';
import hljs from 'highlight.js';
import { ReactElement, useMemo, useRef } from 'react';

type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);
	const ref = useRef<HTMLElement>(null);

	const html = useMemo(() => {
		if (!language || language === 'auto') {
			return hljs.highlightAuto(code).value;
		}

		if (!hljs.getLanguage(language) || language === 'none') {
			return hljs.highlight(code, { language: 'plaintext' }).value;
		}

		try {
			return hljs.highlight(code, { language }).value;
		} catch (e) {
			return hljs.highlight(code, { language: 'plaintext' }).value;
		}
	}, [code, language]);

	return (
		<pre>
			<span className='copyonly'>```</span>
			<code ref={ref} className='code-colors hljs' dangerouslySetInnerHTML={{ __html: html }} />
			<span className='copyonly'>```</span>
		</pre>
	);
};

export default CodeBlock;
