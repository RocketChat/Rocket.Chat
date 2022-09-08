import { Root, parse } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

type ParsedTextProps = {
	katexEnabled?: boolean;
	dollarSyntaxEnabled?: boolean;
	parenthesisSyntaxEnabled?: boolean;
	showColors?: boolean;
};

const isRoot = (text: string | Root): text is Root => Array.isArray(text);

export const useParsedText = (
	textOrRoot: string | Root,
	{ dollarSyntaxEnabled, parenthesisSyntaxEnabled, katexEnabled, showColors = false }: ParsedTextProps,
): Root =>
	useMemo(() => {
		if (!textOrRoot) {
			return [];
		}

		if (isRoot(textOrRoot)) {
			return textOrRoot;
		}

		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(katexEnabled && {
				katex: {
					dollarSyntax: dollarSyntaxEnabled,
					parenthesisSyntax: parenthesisSyntaxEnabled,
				},
			}),
		};

		return parse(textOrRoot, parseOptions);
	}, [showColors, dollarSyntaxEnabled, parenthesisSyntaxEnabled, katexEnabled, textOrRoot]);
