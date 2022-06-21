import { memo, ReactElement, useContext } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type PlainSpanProps = {
	text: string;
};

const PlainSpan = ({ text }: PlainSpanProps): ReactElement => {
	const { highlights, highlightWords } = useContext(MarkupInteractionContext);

	if (highlights) {
		const html = highlights?.length ? highlightWords?.(text, highlights) : text;

		return <span dangerouslySetInnerHTML={{ __html: html }} />;
	}

	return <>{text}</>;
};

export default memo(PlainSpan);
