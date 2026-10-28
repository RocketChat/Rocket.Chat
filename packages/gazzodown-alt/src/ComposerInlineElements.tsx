import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useContext } from 'react';

import ComposerBoldSpan from './ComposerBoldSpan';
import ComposerCodeElement from './ComposerCodeElement';
import ComposerItalicSpan from './ComposerItalicSpan';
import ComposerLinkSpan from './ComposerLinkSpan';
import { ComposerMarkupContext } from './ComposerMarkupContext';
import ComposerMentionChannel from './ComposerMentionChannel';
import ComposerMentionUser from './ComposerMentionUser';
import ComposerPlainSpan from './ComposerPlainSpan';
import ComposerSpoilerSpan from './ComposerSpoilerSpan';
import ComposerStrikeSpan from './ComposerStrikeSpan';
import { sourceOf } from './sourceOf';

type ComposerInlineElementsProps = {
	children: (MessageParser.Inlines | { fallback: MessageParser.Plain; type: undefined })[];
};

const ComposerInlineElements = ({ children }: ComposerInlineElementsProps): ReactElement => {
	const { source = '' } = useContext(ComposerMarkupContext);

	return (
		<>
			{children.map((child, index) => {
				switch (child.type) {
					case 'BOLD':
						return <ComposerBoldSpan key={index}>{child.value}</ComposerBoldSpan>;

					case 'STRIKE':
						return <ComposerStrikeSpan key={index}>{child.value}</ComposerStrikeSpan>;

					case 'ITALIC':
						return <ComposerItalicSpan key={index}>{child.value}</ComposerItalicSpan>;

					case 'SPOILER':
						return <ComposerSpoilerSpan key={index}>{child.value}</ComposerSpoilerSpan>;

					case 'PLAIN_TEXT':
						return <ComposerPlainSpan key={index} text={child.value} />;

					case 'MENTION_USER':
						return <ComposerMentionUser key={index} mention={child.value.value} />;

					case 'MENTION_CHANNEL':
						return <ComposerMentionChannel key={index} mention={child.value.value} />;

					case 'INLINE_CODE':
						return <ComposerCodeElement key={index} code={child.value.value} />;

					case 'LINK':
						return <ComposerLinkSpan key={index} href={child.value.src.value} text={sourceOf(child, source)} />;

					default: {
						if (child.type === undefined) {
							return <ComposerPlainSpan key={index} text={child.fallback.value} />;
						}

						return <ComposerPlainSpan key={index} text={sourceOf(child, source)} />;
					}
				}
			})}
		</>
	);
};

export default ComposerInlineElements;
