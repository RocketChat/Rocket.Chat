import type * as MessageParser from '@rocket.chat/message-parser';
import type { KeyboardEvent, ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ParagraphBlock from './ParagraphBlock';

type SpoilerBlockProps = {
	children: MessageParser.Paragraph[];
};

const spoilerStyle = {
	cursor: 'pointer',
	userSelect: 'none' as const,
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
	overflow: 'hidden' as const,
	padding: 0,
	position: 'absolute' as const,
	whiteSpace: 'nowrap' as const,
	width: 1,
} as const;

const SpoilerBlock = ({ children }: SpoilerBlockProps): ReactElement => {
	const { t } = useTranslation();
	const [revealed, setRevealed] = useState(false);

	const reveal = useCallback(() => {
		setRevealed(true);
	}, []);

	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLDivElement>) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				reveal();
			}
		},
		[reveal],
	);

	const srText = t('Spoiler_hidden_activate_to_reveal', { defaultValue: 'Spoiler hidden. Activate to reveal.' });

	if (revealed) {
		return (
			<div style={revealedStyle}>
				{children.map((paragraph: MessageParser.Paragraph, index: number) => (
					<ParagraphBlock key={index}>{paragraph.value}</ParagraphBlock>
				))}
			</div>
		);
	}

	return (
		<div role='button' tabIndex={0} aria-expanded={false} aria-label={srText} onClick={reveal} onKeyDown={onKeyDown} style={spoilerStyle}>
			<span style={srOnlyStyle}>{srText}</span>
			<div aria-hidden>
				{children.map((paragraph: MessageParser.Paragraph, index: number) => (
					<ParagraphBlock key={index}>{paragraph.value}</ParagraphBlock>
				))}
			</div>
		</div>
	);
};

export default SpoilerBlock;
