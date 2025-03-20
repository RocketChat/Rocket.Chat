import type * as MessageParser from '@rocket.chat/message-parser';
import hljs from 'highlight.js';
import { Fragment, ReactElement, useContext, useLayoutEffect, useMemo, useRef } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);

	const { highlightRegex } = useContext(MarkupInteractionContext);

	const code = useMemo(() => lines.map((line) => line.value.value).join('\n'), [lines]);

	const content = useMemo(() => {
		const regex = highlightRegex?.();

		if (regex) {
			const chunks = code.split(regex);
			const head = chunks.shift() ?? '';

			return (
				<>
					<>{head}</>
					{chunks.map((chunk, i) => {
						if (i % 2 === 0) {
							return (
								<mark key={i} className='highlight-text'>
									{chunk}
								</mark>
							);
						}

						return <Fragment key={i}>{chunk}</Fragment>;
					})}
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

	return (
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
	);
};

export default CodeBlock;
