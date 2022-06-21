import { memo, ReactElement, useContext } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type PlainSpanProps = {
	text: string;
};

const PlainSpan = ({ text }: PlainSpanProps): ReactElement => {
	const { highlights, highlightWords, katex, createKatexMessageRendering } = useContext(MarkupInteractionContext);

	if (highlights || katex) {
		const html = highlights?.length ? highlightWords?.(text, highlights) : text;

		if (katex) {
			return (
				<span
					dangerouslySetInnerHTML={{
						__html:
							createKatexMessageRendering?.(
								{ dollarSyntax: katex.dollarSyntaxEnabled, parenthesisSyntax: katex.parenthesisSyntaxEnabled },
								false,
							)(text) ?? text,
					}}
				/>
			);
		}

		return <span dangerouslySetInnerHTML={{ __html: html }} />;
	}

	return <>{text}</>;
};

export default memo(PlainSpan);
