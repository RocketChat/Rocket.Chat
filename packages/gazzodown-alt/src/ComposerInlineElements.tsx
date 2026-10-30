import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useContext } from 'react';

import ComposerBoldSpan from './ComposerBoldSpan.js';
import ComposerCodeElement from './ComposerCodeElement.js';
import ComposerItalicSpan from './ComposerItalicSpan.js';
import ComposerLinkSpan from './ComposerLinkSpan.js';
import { ComposerMarkupContext } from './ComposerMarkupContext.js';
import ComposerMentionChannel from './ComposerMentionChannel.js';
import ComposerMentionUser from './ComposerMentionUser.js';
import ComposerPlainSpan from './ComposerPlainSpan.js';
import ComposerSpoilerSpan from './ComposerSpoilerSpan.js';
import ComposerStrikeSpan from './ComposerStrikeSpan.js';
import { sourceOf } from './sourceOf.js';

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
