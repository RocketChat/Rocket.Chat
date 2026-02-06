import type * as MessageParser from '@rocket.chat/message-parser';
import hljs from 'highlight.js';
import type { ReactElement } from 'react';
import {
	Fragment,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useCallback,
} from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type CodeBlockProps = {
	language?: string;
	lines?: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);
	const [copied, setCopied] = useState(false);

	const { highlightRegex } = useContext(MarkupInteractionContext);

	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (error) {
			console.error('Failed to copy code block', error);
		}
	}, [code]);

	const content = useMemo(() => {
		const regex = highlightRegex?.();

		if (!regex) {
			return code;
		}

		const chunks = code.split(regex);
		const head = chunks.shift() ?? '';

		return (
			<>
				<>{head}</>
				{chunks.map((chunk, index) =>
					index % 2 === 0 ? (
						<mark key={index} className='highlight-text'>
							{chunk}
						</mark>
					) : (
						<Fragment key={index}>{chunk}</Fragment>
					),
				)}
			</>
		);
	}, [code, highlightRegex]);

	useLayoutEffect(() => {
		const element = ref.current;

		if (!element) {
			return;
		}

		hljs.highlightElement(element);

		if (!element.classList.contains('hljs')) {
			element.classList.add('hljs');
		}
	}, [language, content]);

	return (
		<pre role='region' style={{ position: 'relative' }}>
			<button
				type='button'
				onClick={handleCopy}
				aria-label='Copy code'
				style={{
					position: 'absolute',
					top: '6px',
					right: '6px',
					fontSize: '12px',
					padding: '4px 8px',
					cursor: 'pointer',
					zIndex: 1,
				}}
			>
				{copied ? 'Copied' : 'Copy'}
			</button>

			<span className='copyonly'>```</span>
			<code
				ref={ref}
				className={(!language || language === 'none') ? 'code-colors' : `code-colors language-${language}`}
			>
				{content}
			</code>
			<span className='copyonly'>```</span>
		</pre>
	);
};

export default CodeBlock;
