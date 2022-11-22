import type * as MessageParser from '@rocket.chat/message-parser';
import { ReactElement, useMemo } from 'react';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

const getBaseURI = (): string => {
	if (document.baseURI) {
		return document.baseURI;
	}

	// Should be exactly one tag:
	//   https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
	const base = document.getElementsByTagName('base');

	// Return location from BASE tag.
	if (base.length > 0) {
		return base[0].href;
	}

	// Else use implementation of documentURI:
	//   http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-baseURI
	return document.URL;
};

const isExternal = (href: string): boolean => href.indexOf(getBaseURI()) !== 0;

type LinkSpanProps = {
	href: string;
	label: MessageParser.Markup;
};

const LinkSpan = ({ href, label }: LinkSpanProps): ReactElement => {
	const children = useMemo(() => {
		const labelArray = Array.isArray(label) ? label : [label];

		const labelElements = labelArray.map((child, index) => {
			switch (child.type) {
				case 'PLAIN_TEXT':
					return <PlainSpan key={index} text={child.value} />;

				case 'STRIKE':
					return <StrikeSpan key={index} children={child.value} />;

				case 'ITALIC':
					return <ItalicSpan key={index} children={child.value} />;

				case 'BOLD':
					return <BoldSpan key={index} children={child.value} />;

				default:
					return null;
			}
		});

		return labelElements;
	}, [label]);

	if (isExternal(href)) {
		return (
			<a href={href} title={href} rel='noopener noreferrer' target='_blank'>
				{children}
			</a>
		);
	}

	return (
		<a href={href} title={href}>
			{children}
		</a>
	);
};

export default LinkSpan;
