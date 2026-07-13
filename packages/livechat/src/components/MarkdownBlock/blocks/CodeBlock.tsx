import type * as MessageParser from '@rocket.chat/message-parser';
import hljs from 'highlight.js';
import { useLayoutEffect, useMemo, useRef } from 'preact/hooks';

import styles from './CodeBlock.scss';

export type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps) => {
	const ref = useRef<HTMLElement>(null);

	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);

	useLayoutEffect(() => {
		const element = ref.current;

		if (!element) {
			return;
		}

		hljs.highlightElement(element);
		if (!element.classList.contains('hljs')) {
			element.classList.add('hljs');
		}
	}, [language, code]);

	return (
		<pre className={styles.codeblock} role='region'>
			<span className={styles.codeblock__copyonly}>```</span>
			<code
				key={language + code}
				ref={ref}
				className={((!language || language === 'none') && 'code-colors') || `code-colors language-${language}`}
			>
				{code}
			</code>
			<span className={styles.codeblock__copyonly}>```</span>
		</pre>
	);
};

export default CodeBlock;
