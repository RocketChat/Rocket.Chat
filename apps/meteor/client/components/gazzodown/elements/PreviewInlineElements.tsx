import * as MessageParser from '@rocket.chat/message-parser';
import React, { Fragment, ReactElement } from 'react';

import PreviewColorElement from './PreviewColorElement';
import PreviewEmojiElement from './PreviewEmojiElement';

type PreviewInlineElementsProps = {
	children: MessageParser.Inlines[];
};

const PreviewInlineElements = ({ children }: PreviewInlineElementsProps): ReactElement => (
	<>
		{children.map((child, index) => {
			switch (child.type) {
				case 'BOLD':
				case 'ITALIC':
				case 'STRIKE':
					return <PreviewInlineElements key={index} children={child.value} />;

				case 'LINK':
					return <PreviewInlineElements key={index} children={[child.value.label]} />;

				case 'PLAIN_TEXT':
					return <Fragment key={index} children={child.value} />;

				case 'IMAGE':
					return <PreviewInlineElements key={index} children={[child.value.label]} />;

				case 'MENTION_USER':
					return <Fragment key={index}>@{child.value.value}</Fragment>;

				case 'MENTION_CHANNEL':
					return <Fragment key={index}>#{child.value.value}</Fragment>;

				case 'INLINE_CODE':
					return <Fragment key={index} children={child.value.value} />;

				case 'EMOJI':
					return <PreviewEmojiElement key={index} handle={child.value.value} />;

				case 'COLOR':
					return <PreviewColorElement key={index} {...child.value} />;

				default:
					return null;
			}
		})}
	</>
);

export default PreviewInlineElements;
