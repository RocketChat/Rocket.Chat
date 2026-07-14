import type * as MessageParser from '@rocket.chat/message-parser';
import { useCallback, useMemo, useState } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import BoldSpan from './BoldSpan';
import ChannelMentionElement from './ChannelMentionElement';
import CodeElement from './CodeElement';
import ColorElement from './ColorElement';
import EmojiElement from './EmojiElement';
import ImageElement from './ImageElement';
import ItalicSpan from './ItalicSpan';
import LinkSpan from './LinkSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import Timestamp from './Timestamp';
import UserMentionElement from './UserMentionElement';

export type SpoilerSpanProps = {
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

const SpoilerSpan = ({ children }: SpoilerSpanProps) => {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);

	const reveal = useCallback(() => {
		setRevealed(true);
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				reveal();
			}
		},
		[reveal],
	);

	const content = useMemo(
		() =>
			children.map((block, index) => {
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

					case 'TIMESTAMP':
						return <Timestamp key={index}>{block}</Timestamp>;

					case 'COLOR':
						return <ColorElement key={index} {...block.value} />;

					case 'IMAGE':
						return <ImageElement key={index} src={block.value.src.value} alt={block.value.label} />;

					case 'INLINE_KATEX':
						return <PlainSpan key={index} text={block.value} />;

					default:
						return null;
				}
			}),
		[children],
	);

	if (revealed) {
		return <span style={revealedStyle}>{content}</span>;
	}

	const srText = t('Spoiler_hidden_activate_to_reveal', { defaultValue: 'Spoiler hidden. Activate to reveal.' });

	return (
		<span role='button' tabIndex={0} aria-label={srText} onClick={reveal} onKeyDown={onKeyDown} style={spoilerStyle}>
			<span style={srOnlyStyle}>{srText}</span>
			<span aria-hidden>{content}</span>
		</span>
	);
};

export default SpoilerSpan;
