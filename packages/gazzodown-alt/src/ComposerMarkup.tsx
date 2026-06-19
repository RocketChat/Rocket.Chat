import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { memo } from 'react';

import ComposerCodeBlock from './ComposerCodeBlock';
import ComposerInlineElements from './ComposerInlineElements';
import ComposerPlainSpan from './ComposerPlainSpan';

type ComposerMarkupProps = {
	tokens: MessageParser.Root;
};

/**
 * Real-time WYSIWYG-friendly markup renderer.
 *
 * Unlike the standard `Markup` from `@rocket.chat/gazzodown`, this component:
 * - Renders paragraphs as `<span>` instead of `<div>` for inline layout
 * - Represents line breaks with `\n` characters instead of `<br>` tags
 * - Avoids heavy Fuselage dependencies (MessageHighlight, CheckBox, etc.)
 * - Is optimized for re-rendering on every keystroke
 *
 * It consumes the same AST produced by `@rocket.chat/message-parser` (grammar.pegjs),
 * making it a drop-in replacement for the rendering layer.
 */
const ComposerMarkup = ({ tokens }: ComposerMarkupProps): ReactElement => (
	<>
		{tokens.map((block, index) => {
			switch (block.type) {
				case 'PARAGRAPH':
					return (
						<span key={index}>
							<ComposerInlineElements>{block.value}</ComposerInlineElements>
							{'\n'}
						</span>
					);

				case 'HEADING':
					return (
						<span key={index} style={headingStyles[block.level]}>
							{`${'#'.repeat(block.level)} `}
							{block.value.map((plain, pidx) => (
								<ComposerPlainSpan key={pidx} text={typeof plain.value === 'string' ? plain.value : ''} />
							))}
							{'\n'}
						</span>
					);

				case 'QUOTE':
					return (
						<span key={index} style={quoteStyle}>
							{block.value.map((paragraph, pidx) => (
								<span key={pidx}>
									{'> '}
									<ComposerInlineElements>{paragraph.value}</ComposerInlineElements>
									{'\n'}
								</span>
							))}
						</span>
					);

				case 'SPOILER_BLOCK':
					return (
						<span key={index} style={spoilerBlockStyle}>
							{block.value.map((paragraph, pidx) => (
								<span key={pidx}>
									<ComposerInlineElements>{paragraph.value}</ComposerInlineElements>
									{'\n'}
								</span>
							))}
						</span>
					);

				case 'CODE':
					return <ComposerCodeBlock key={index} language={block.language} lines={block.value} />;

				case 'LINE_BREAK':
					return <span key={index}>{'\n'}</span>;

				default:
					return null;
			}
		})}
	</>
);

const headingStyles: Record<1 | 2 | 3 | 4, React.CSSProperties> = {
	1: { fontWeight: 'bold', fontSize: '1.5em' },
	2: { fontWeight: 'bold', fontSize: '1.3em' },
	3: { fontWeight: 'bold', fontSize: '1.1em' },
	4: { fontWeight: 'bold', fontSize: '1em' },
};

const quoteStyle: React.CSSProperties = {
	borderInlineStart: '2px solid var(--rcx-color-stroke-light, #ccc)',
	paddingInlineStart: '8px',
	color: 'var(--rcx-color-font-secondary-info, #666)',
};

const spoilerBlockStyle: React.CSSProperties = {
	backgroundColor: 'var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.08))',
	borderRadius: '2px',
	padding: '0 2px',
};

export default memo(ComposerMarkup);
