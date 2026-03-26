import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import ComposerBoldSpan from './ComposerBoldSpan';
import ComposerItalicSpan from './ComposerItalicSpan';
import ComposerPlainSpan from './ComposerPlainSpan';
import ComposerStrikeSpan from './ComposerStrikeSpan';

type ComposerLinkSpanProps = {
	href: string;
	label: MessageParser.Markup | MessageParser.Markup[];
};

const ComposerLinkSpan = ({ href, label }: ComposerLinkSpanProps): ReactElement => {
	const labelArray = Array.isArray(label) ? label : [label];

	return (
		<span title={href} style={{ textDecoration: 'underline', color: 'var(--rcx-color-font-info, #156FF5)' }}>
			{labelArray.map((child, index) => {
				switch (child.type) {
					case 'PLAIN_TEXT':
						return <ComposerPlainSpan key={index} text={child.value} />;
					case 'STRIKE':
						return <ComposerStrikeSpan key={index}>{child.value}</ComposerStrikeSpan>;
					case 'ITALIC':
						return <ComposerItalicSpan key={index}>{child.value}</ComposerItalicSpan>;
					case 'BOLD':
						return <ComposerBoldSpan key={index}>{child.value}</ComposerBoldSpan>;
					default:
						return null;
				}
			})}
		</span>
	);
};

export default ComposerLinkSpan;
