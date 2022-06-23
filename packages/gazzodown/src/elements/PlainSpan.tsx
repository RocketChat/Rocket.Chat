import { Fragment, memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type PlainSpanProps = {
	text: string;
};

const PlainSpan = ({ text }: PlainSpanProps): ReactElement => {
	const { highlightRegex } = useContext(MarkupInteractionContext);

	const content = useMemo(() => {
		const regex = highlightRegex?.();

		if (regex) {
			const chunks = text.split(regex);
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

		return text;
	}, [text, highlightRegex]);

	return <>{content}</>;
};

export default memo(PlainSpan);
