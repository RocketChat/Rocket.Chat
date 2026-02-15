import { Box, IconButton } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import hljs from 'highlight.js';
import type { ReactElement } from 'react';
import { Fragment, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const copyToClipboard = async (text: string): Promise<boolean> => {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fallback to execCommand below when Clipboard API is unavailable or blocked.
		}
	}

	if (typeof document === 'undefined') {
		return false;
	}

	const element = document.createElement('textarea');
	element.value = text;
	element.setAttribute('readonly', '');
	element.style.position = 'fixed';
	element.style.opacity = '0';
	element.style.pointerEvents = 'none';
	document.body.appendChild(element);
	element.select();

	const hasCopied = document.execCommand('copy');
	document.body.removeChild(element);
	return hasCopied;
};

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);
	const [copied, setCopied] = useState(false);
	const { t } = useTranslation();

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

	useEffect(() => {
		if (!copied) {
			return;
		}

		const timeout = setTimeout(() => {
			setCopied(false);
		}, 3000);

		return () => {
			clearTimeout(timeout);
		};
	}, [copied]);

	const handleCopy = useCallback((): void => {
		void copyToClipboard(code).then((hasCopied) => {
			setCopied(hasCopied);
		});
	}, [code]);

	return (
		<pre role='region'>
			<span className='copyonly'>```</span>
			<Box is='span' display='block' position='relative'>
				<Box is='span' display='inline-flex' alignItems='center' position='absolute' style={{ top: 8, right: 8 }} zIndex={1}>
					{copied && (
						<Box is='span' fontScale='c1' mie={4} aria-live='polite'>
							{t('Copied')}
						</Box>
					)}
					<IconButton
						small
						icon={copied ? 'check' : 'copy'}
						aria-label={copied ? t('Copied') : t('Copy')}
						secondary
						style={{
							borderWidth: 1,
							borderStyle: 'solid',
							borderRadius: 4,
							borderColor: 'var(--rcx-color-stroke-light, #cbcdd2)',
						}}
						onClick={handleCopy}
					/>
				</Box>
				<code
					key={language + code}
					ref={ref}
					className={((!language || language === 'none') && 'code-colors') || `code-colors language-${language}`}
					style={{ display: 'block', paddingRight: 44 }}
				>
					{content}
				</code>
			</Box>
			<span className='copyonly'>```</span>
		</pre>
	);
};

export default CodeBlock;
