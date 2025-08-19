import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import { forwardRef, memo, useRef } from 'react';
import type { ListRange, VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import EmojiCategoryRow from './EmojiCategoryRow';
import type { EmojiPickerItem } from '../../../../app/emoji/client';
import { VirtualizedScrollbars } from '../../../components/CustomScrollbars';

type CategoriesResultProps = {
	items: EmojiPickerItem[];
	customItemsLimit: number;
	handleLoadMore: () => void;
	handleSelectEmoji: (event: MouseEvent<HTMLElement>) => void;
	handleScroll: (range: ListRange) => void;
};

const CategoriesResult = forwardRef<VirtuosoHandle, CategoriesResultProps>(function CategoriesResult(
	{ items, customItemsLimit, handleLoadMore, handleSelectEmoji, handleScroll },
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
			<VirtualizedScrollbars>
				<Virtuoso
					ref={ref}
					totalCount={items.length}
					data={items}
					rangeChanged={handleScroll}
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
					itemContent={(_, item) => (
						<EmojiCategoryRow
							item={item}
							customItemsLimit={customItemsLimit}
							handleLoadMore={handleLoadMore}
							handleSelectEmoji={handleSelectEmoji}
						/>
					)}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
});

export default memo(CategoriesResult);
