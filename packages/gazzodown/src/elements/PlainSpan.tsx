import { Fragment, memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type PlainSpanProps = {
	text: string;
};

const PlainSpan = ({ text }: PlainSpanProps): ReactElement => {
	const { highlightRegex, markRegex } = useContext(MarkupInteractionContext);

	const content = useMemo(() => {
		if (highlightRegex) {
			const chunks = text.split(highlightRegex());
			const head = chunks.shift() ?? '';

			return (
				<>
					<>{head}</>
					{chunks.map((chunk, i) => {
						if (i % 2 === 0) {
							return (
								<mark key={i} className='highlight-text'>
									{chunk}
								</mark>
							);
						}

						return <Fragment key={i}>{chunk}</Fragment>;
					})}
				</>
			);
		}

		if (markRegex) {
			const chunks = text.split(markRegex());
			const head = chunks.shift() ?? '';

			return (
				<>
					<>{head}</>
					{chunks.map((chunk, i) => {
						if (i % 2 === 0) {
							return <mark key={i}>{chunk}</mark>;
						}

						return <Fragment key={i}>{chunk}</Fragment>;
					})}
				</>
			);
		}

		return text;
	}, [text, highlightRegex, markRegex]);

	return <>{content}</>;
};

export default memo(PlainSpan);
