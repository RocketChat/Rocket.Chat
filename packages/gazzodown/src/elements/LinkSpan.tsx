import type * as MessageParser from '@rocket.chat/message-parser';
import { getBaseURI, isExternal } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { ReactElement, useMemo } from 'react';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';

type LinkSpanProps = {
	href: string;
	label: MessageParser.Markup | MessageParser.Markup[];
};

const LinkSpan = ({ href, label }: LinkSpanProps): ReactElement => {
	const t = useTranslation();
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
		<a href={href} title={t('Go_to_href', { href: href.replace(getBaseURI(), '') })}>
			{children}
		</a>
	);
};

export default LinkSpan;
