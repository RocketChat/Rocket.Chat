import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { memo, useContext } from 'react';

import ComposerCodeBlock from './ComposerCodeBlock';
import ComposerInlineElements from './ComposerInlineElements';
import { ComposerMarkupContext } from './ComposerMarkupContext';
import ComposerOrderedList from './ComposerOrderedList';
import ComposerPlainSpan from './ComposerPlainSpan';
import ComposerUnorderedList from './ComposerUnorderedList';
import { sourceOf } from './sourceOf';

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
 *
 * Every renderer must emit the exact text it was parsed from: caret positions are flat character
 * offsets over the rendered text, so adding or dropping a character misplaces the caret. Nodes with
 * no visual renderer fall back to their literal markup through `sourceOf`.
 */
const ComposerMarkup = ({ tokens }: ComposerMarkupProps): ReactElement => {
	const { source = '' } = useContext(ComposerMarkupContext);

	// Blocks consume their own line ending, but a node rebuilt from the source may or may not carry it.
	const blockSource = (block: MessageParser.HorizontalRule | MessageParser.Table): string => {
		const text = sourceOf(block, source);

		return text.endsWith('\n') ? text : `${text}\n`;
	};

	return (
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
								<ComposerInlineElements>{block.value}</ComposerInlineElements>
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

					case 'UNORDERED_LIST':
						return <ComposerUnorderedList key={index} items={block.value} />;

					case 'ORDERED_LIST':
						return <ComposerOrderedList key={index} items={block.value} />;

					case 'TASKS':
						return (
							<span key={index}>
								{block.value.map((task, tidx) => (
									<span key={tidx}>
										{task.status ? '- [x] ' : '- [ ] '}
										<ComposerInlineElements>{task.value}</ComposerInlineElements>
										{'\n'}
									</span>
								))}
							</span>
						);

					case 'HORIZONTAL_RULE':
					case 'TABLE':
						return <ComposerPlainSpan key={index} text={blockSource(block)} />;

					case 'BIG_EMOJI':
						return <ComposerPlainSpan key={index} text={sourceOf(block, source)} />;

					case 'LINE_BREAK':
						return <span key={index}>{'\n'}</span>;

					default:
						return null;
				}
			})}
		</>
	);
};

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
