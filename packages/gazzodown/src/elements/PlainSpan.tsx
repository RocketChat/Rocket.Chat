import { useTranslation } from '@rocket.chat/ui-contexts';
import { Fragment, memo, ReactElement, useContext, useMemo } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';

type PlainSpanProps = {
	text: string;
};

const PlainSpan = ({ text }: PlainSpanProps): ReactElement => {
	const t = useTranslation();
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
								<mark title={t('Highlighted_chosen_word')} key={i} className='highlight-text'>
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
	}, [highlightRegex, markRegex, text, t]);

	return <>{content}</>;
};

export default memo(PlainSpan);
