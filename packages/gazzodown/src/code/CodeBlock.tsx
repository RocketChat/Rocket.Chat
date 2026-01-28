import type * as MessageParser from '@rocket.chat/message-parser';
import hljs from 'highlight.js';
import type { ReactElement } from 'react';
import { Fragment, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);
	const [copied, setCopied] = useState(false);

	const { highlightRegex } = useContext(MarkupInteractionContext);

	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);

	const content = useMemo(() => {
		const regex = highlightRegex?.();

		if (regex) {
			const chunks = code.split(regex);
			const head = chunks.shift() ?? '';

			return (
				<>
					{head}
					{chunks.map((chunk, i) =>
						i % 2 === 0 ? (
							<mark key={i} className='highlight-text'>
								{chunk}
							</mark>
						) : (
							<Fragment key={i}>{chunk}</Fragment>
						),
					)}
				</>
			);
		}

		return code;
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

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (e) {
			console.error('Copy failed', e);
		}
	};

	return (
		<div
			className='rc-code-block'
			style={{ position: 'relative' }}
		>
			<button
				onClick={handleCopy}
				title='Copy code'
				aria-label='Copy code block'
				style={{
					position: 'absolute',
					top: 6,
					right: 6,
					fontSize: 12,
					padding: '4px 6px',
					cursor: 'pointer',
					borderRadius: 4,
					border: 'none',
					background: '#2f343d',
					color: '#fff',
					opacity: 0.85,
				}}
				className='rc-code-copy-button'
			>
				{copied ? 'Copied' : 'Copy'}
			</button>

			<pre role='region'>
				<span className='copyonly'>```</span>
				<code
					key={language + code}
					ref={ref}
					className={((!language || language === 'none') && 'code-colors') || `code-colors language-${language}`}
				>
					{content}
				</code>
				<span className='copyonly'>```</span>
			</pre>
		</div>
	);
};

export default CodeBlock;
