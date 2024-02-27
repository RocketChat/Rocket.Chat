import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { MouseEvent, UIEventHandler, MutableRefObject } from 'react';
import React, { forwardRef, useRef } from 'react';
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
	handleScroll: UIEventHandler<HTMLDivElement>;
};

const CategoriesResult = forwardRef<VirtuosoHandle, CategoriesResultProps>(function CategoriesResult(
	{ emojiListByCategory, categoriesPosition, customItemsLimit, handleLoadMore, handleSelectEmoji, handleScroll },
	ref,
) {
	const wrapper = useRef<HTMLDivElement>(null);

	return (
		<Box
			ref={wrapper}
			className={css`
				&.pointer-none .rcx-emoji-picker__element {
					pointer-events: none;
				}
			`}
			height='full'
		>
			<Virtuoso
				ref={ref}
				totalCount={emojiListByCategory.length}
				data={emojiListByCategory}
				onScroll={handleScroll}
				components={{ Scroller: ScrollableContentWrapper }}
				isScrolling={(isScrolling: boolean) => {
					if (!wrapper.current) {
						return;
					}

					if (isScrolling) {
						wrapper.current.classList.add('pointer-none');
					} else {
						wrapper.current.classList.remove('pointer-none');
					}
				}}
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
		</Box>
	);
});

export default CategoriesResult;
