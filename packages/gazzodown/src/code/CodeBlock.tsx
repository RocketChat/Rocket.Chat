import { css } from '@rocket.chat/css-in-js';
import { IconButton, Box } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import hljs from 'highlight.js';
import type { ReactElement } from 'react';
import { Fragment, useContext, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type CodeBlockProps = {
	language?: string;
	lines: MessageParser.CodeLine[];
};

const onHoverStyle = css`
	opacity: 0;
	user-select: none;

	[data-code-block-wrapper]:hover &,
	[data-code-block-wrapper]:focus-within & {
		opacity: 1;
	}
`;

const CodeBlock = ({ lines = [], language }: CodeBlockProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);

	const { highlightRegex } = useContext(MarkupInteractionContext);
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

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

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(code);
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error instanceof Error ? error.message : t('Failed_to_copy') });
		}
	}, [code, dispatchToastMessage, t]);

	return (
		<Box is='pre' position='relative' data-code-block-wrapper role='region'>
			<IconButton
				icon='copy'
				small
				className={onHoverStyle}
				title={t('Copy')}
				onClick={() => {
					void handleCopy();
				}}
				position='absolute'
				insetInlineEnd={0}
				margin={8}
			/>
			<span className='copyonly'>```</span>
			<code
				key={language + code}
				ref={ref}
				className={((!language || language === 'none') && 'code-colors') || `code-colors language-${language}`}
			>
				{content}
			</code>
			<span className='copyonly'>```</span>
		</Box>
	);
};

export default CodeBlock;
