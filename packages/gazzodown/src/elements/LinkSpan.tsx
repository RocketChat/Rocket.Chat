import type * as MessageParser from '@rocket.chat/message-parser';
import { getBaseURI, isExternal } from '@rocket.chat/ui-client';
import { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import BoldSpan from './BoldSpan';
import ItalicSpan from './ItalicSpan';
import PlainSpan from './PlainSpan';
import StrikeSpan from './StrikeSpan';
import { sanitizeUrl } from './sanitizeUrl';

type LinkSpanProps = {
	href: string;
	label: MessageParser.Markup | MessageParser.Markup[];
};

const LinkSpan = ({ href, label }: LinkSpanProps): ReactElement => {
	// Should sanitize 'href' if any of the insecure prefixes are present - see DSK-34 on Jira
	const sanitizedHref = sanitizeUrl(href);

	const { t } = useTranslation();
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

	if (isExternal(sanitizedHref)) {
		return (
			<a href={sanitizedHref} title={sanitizedHref} rel='noopener noreferrer' target='_blank'>
				{children}
			</a>
		);
	}

	return (
		<a href={sanitizedHref} title={t('Go_to_href', { href: sanitizedHref.replace(getBaseURI(), '') })}>
			{children}
		</a>
	);
};

export default LinkSpan;
