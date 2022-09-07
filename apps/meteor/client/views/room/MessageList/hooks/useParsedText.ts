import { Root, parse } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

type ParsedTextProps = {
	text: string;
	katex?: {
		dollarSyntaxEnabled?: boolean;
		parenthesisSyntaxEnabled?: boolean;
	};
	showColors?: boolean;
};

export const useParsedText = ({ text, katex = undefined, showColors = false }: ParsedTextProps): Root =>
	useMemo(() => {
		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(katex && {
				katex: {
					dollarSyntax: katex.dollarSyntaxEnabled,
					parenthesisSyntax: katex.parenthesisSyntaxEnabled,
				},
			}),
		};

		if (!text) {
			return [];
		}

		return parse(text, parseOptions);
	}, [showColors, katex, text]);
