import type * as MessageParser from '@rocket.chat/message-parser';
import { useMemo } from 'preact/hooks';

import styles from './CodeBlock.scss';

export type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps) => {
	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);

	return (
		<pre className={styles.codeblock} role='region'>
			<span className={styles.codeblock__copyonly}>```</span>
			<code className={((!language || language === 'none') && 'code-colors') || `code-colors language-${language}`}>{code}</code>
			<span className={styles.codeblock__copyonly}>```</span>
		</pre>
	);
};

export default CodeBlock;
