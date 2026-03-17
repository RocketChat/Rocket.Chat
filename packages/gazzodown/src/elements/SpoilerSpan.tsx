import type * as MessageParser from '@rocket.chat/message-parser';
import type { KeyboardEvent, ReactElement } from 'react';
import { lazy, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BoldSpan from './BoldSpan';
import ImageElement from './ImageElement';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import Timestamp from './Timestamp';
import CodeElement from '../code/CodeElement';
import ColorElement from '../colors/ColorElement';
import EmojiElement from '../emoji/EmojiElement';
import KatexErrorBoundary from '../katex/KatexErrorBoundary';
import ChannelMentionElement from '../mentions/ChannelMentionElement';
import UserMentionElement from '../mentions/UserMentionElement';

const KatexElement = lazy(() => import('../katex/KatexElement'));

type SpoilerSpanProps = {
	children: MessageParser.Spoiler['value'];
};

const spoilerStyle = {
	cursor: 'pointer',
	userSelect: 'none',
	borderRadius: 2,
	paddingInline: 2,
	filter: 'blur(4px)',
	transition: 'filter 230ms ease',
} as const;

const revealedStyle = {
	filter: 'none',
	transition: 'filter 230ms ease',
} as const;

const srOnlyStyle = {
	border: 0,
	clip: 'rect(0 0 0 0)',
	height: 1,
	margin: -1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
} as const;

const SpoilerSpan = ({ children }: SpoilerSpanProps): ReactElement => {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);

	const reveal = useCallback(() => {
		setRevealed(true);
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLSpanElement>) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				reveal();
			}
		},
		[reveal],
	);

	const srText = t('Spoiler_hidden_activate_to_reveal', { defaultValue: 'Spoiler hidden. Activate to reveal.' });

	if (revealed) {
		return <span style={revealedStyle}>{children.map((block, index) => renderBlockComponent(block, index))}</span>;
	}

	return (
		<span role='button' tabIndex={0} aria-expanded={false} aria-label={srText} onClick={reveal} onKeyDown={onKeyDown} style={spoilerStyle}>
			<span style={srOnlyStyle}>{srText}</span>
			<span aria-hidden>{children.map((block, index) => renderBlockComponent(block, index))}</span>
		</span>
	);
};

const renderBlockComponent = (block: MessageParser.Inlines, index: number): ReactElement | null => {
	switch (block.type) {
		case 'EMOJI':
			return <EmojiElement key={index} {...block} />;

		case 'MENTION_USER':
			return <UserMentionElement key={index} mention={block.value.value} />;

		case 'MENTION_CHANNEL':
			return <ChannelMentionElement key={index} mention={block.value.value} />;

		case 'PLAIN_TEXT':
			return <PlainSpan key={index} text={block.value} />;

		case 'LINK':
			return <LinkSpan key={index} href={block.value.src.value} label={block.value.label} />;

		case 'STRIKE':
			return <StrikeSpan key={index}>{block.value}</StrikeSpan>;

		case 'ITALIC':
			return <ItalicSpan key={index}>{block.value}</ItalicSpan>;

		case 'BOLD':
			return <BoldSpan key={index}>{block.value}</BoldSpan>;

		case 'INLINE_CODE':
			return <CodeElement key={index} code={block.value.value} />;

		case 'SPOILER':
			return <SpoilerSpan key={index}>{block.value}</SpoilerSpan>;

		case 'TIMESTAMP':
			return <Timestamp key={index}>{block}</Timestamp>;

		case 'COLOR':
			return <ColorElement key={index} {...block.value} />;

		case 'IMAGE':
			return <ImageElement key={index} src={block.value.src.value} alt={block.value.label} />;

		case 'INLINE_KATEX':
			return (
				<KatexErrorBoundary key={index} code={block.value}>
					<KatexElement code={block.value} />
				</KatexErrorBoundary>
			);

		default:
			return null;
	}
};

export default SpoilerSpan;
