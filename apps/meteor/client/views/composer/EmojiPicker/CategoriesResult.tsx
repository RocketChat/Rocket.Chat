import type { MouseEvent, UIEventHandler, MutableRefObject } from 'react';
import React, { forwardRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import type { EmojiCategoryPosition, EmojiByCategory } from '../../../../app/emoji/client';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import EmojiCategoryRow from './EmojiCategoryRow';

type CategoriesResultProps = {
	emojiListByCategory: EmojiByCategory[];
	categoriesPosition: MutableRefObject<EmojiCategoryPosition[]>;
	customItemsLimit: number;
	handleLoadMore: () => void;
	handleSelectEmoji: (event: MouseEvent<HTMLElement>) => void;
	handleScroll: UIEventHandler<'div'>;
};

const CategoriesResult = forwardRef<VirtuosoHandle, CategoriesResultProps>(function CategoriesResult(
	{ emojiListByCategory, categoriesPosition, customItemsLimit, handleLoadMore, handleSelectEmoji, handleScroll },
	ref,
) {
	return (
		<Virtuoso
			ref={ref}
			totalCount={emojiListByCategory.length}
			data={emojiListByCategory}
			components={{ Scroller: ScrollableContentWrapper }}
			onScroll={handleScroll}
			itemContent={(_, data) => (
				<EmojiCategoryRow
					categoryKey={data.key}
					categoriesPosition={categoriesPosition}
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
