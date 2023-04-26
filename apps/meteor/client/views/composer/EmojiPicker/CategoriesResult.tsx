import type { MouseEvent, UIEventHandler } from 'react';
import React, { forwardRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import EmojiCategoryRow from './EmojiCategoryRow';

type CategoriesResultProps = {
	emojiListByCategory: any;
	catPositions: any;
	customItemsLimit: number;
	handleLoadMore: () => void;
	handleSelectEmoji: (event: MouseEvent<HTMLElement>) => void;
	handleScroll: UIEventHandler<'div'>;
};

const CategoriesResult = forwardRef<VirtuosoHandle, CategoriesResultProps>(function CategoriesResult(
	{ emojiListByCategory, catPositions, customItemsLimit, handleLoadMore, handleSelectEmoji, handleScroll },
	ref,
) {
	return (
		<Virtuoso
			ref={ref}
			totalCount={emojiListByCategory.length}
			data={emojiListByCategory}
			components={{ Scroller: ScrollableContentWrapper }}
			onScroll={handleScroll}
			// computeItemKey={computeItemKey}
			itemContent={(_, data) => (
				<EmojiCategoryRow
					catKey={data.key}
					catPositions={catPositions}
					customItemsLimit={customItemsLimit}
					handleLoadMore={handleLoadMore}
					handleSelectEmoji={handleSelectEmoji}
					{...data}
				/>
			)}
		/>
	);
});

export default CategoriesResult;
