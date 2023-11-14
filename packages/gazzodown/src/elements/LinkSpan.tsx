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
	label: MessageParser.Markup | MessageParser.Markup[];
};

/**
 * Parses the provided URL string that might contain HTML-encoded characters.
 * This function uses DOMParser to decode the HTML-encoded URL and then parses it using the URL constructor.
 * It returns the resulting URL string after decoding and parsing.
 *
 * @param url - The URL string that might contain HTML-encoded characters
 * @returns A string representing the parsed and decoded URL
 */
const parseLinkUrl = (url: string): string => {
	// Decoding the HTML encoded URL using DOMParser
	const parser = new DOMParser();
	const decodedURL = parser.parseFromString(`<!doctype html><body>${url}`, 'text/html').body.textContent as string;

	// Parsing the URL using the URL constructor
	const urlInstance = new URL(decodedURL);
	return urlInstance.toString();
};

const LinkSpan = ({ href, label }: LinkSpanProps): ReactElement => {
	const parsedHrefUrl = parseLinkUrl(href);

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

	if (isExternal(parsedHrefUrl)) {
		return (
			<a href={parsedHrefUrl} title={parsedHrefUrl} rel='noopener noreferrer' target='_blank'>
				{children}
			</a>
		);
	}

	return (
		<a href={parsedHrefUrl} title={parsedHrefUrl}>
			{children}
		</a>
	);
};

export default LinkSpan;
