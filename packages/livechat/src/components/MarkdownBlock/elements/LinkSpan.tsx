import type * as MessageParser from '@rocket.chat/message-parser';
import { useMemo } from 'preact/hooks';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import { sanitizeUrl } from '../url';

export type LinkSpanProps = {
	href: string;
	label: MessageParser.Markup | MessageParser.Markup[];
};

const LinkSpan = ({ href, label }: LinkSpanProps) => {
	// Should sanitize 'href' if any of the insecure prefixes are present - see DSK-34 on Jira
	const sanitizedHref = sanitizeUrl(href);

	const children = useMemo(() => {
		const labelArray = Array.isArray(label) ? label : [label];

		const labelElements = labelArray.map((child, index) => {
			switch (child.type) {
				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={child.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index}>{child.value}</StrikeSpan>;

				case 'ITALIC':
					return <ItalicSpan key={index}>{child.value}</ItalicSpan>;

				case 'BOLD':
					return <BoldSpan key={index}>{child.value}</BoldSpan>;

				default:
					return null;
			}
		});

		return labelElements;
	}, [label]);

	return (
		<a href={sanitizedHref} title={sanitizedHref} rel='noopener noreferrer' target='_blank'>
			{children}
		</a>
	);
};

export default LinkSpan;
