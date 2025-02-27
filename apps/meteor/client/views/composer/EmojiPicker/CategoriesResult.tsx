import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { MouseEvent, UIEventHandler } from 'react';
import { forwardRef, memo, useRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import EmojiCategoryRow from './EmojiCategoryRow';
import type { EmojiByCategory } from '../../../../app/emoji/client';
import { CustomScrollbars } from '../../../components/CustomScrollbars';

type CategoriesResultProps = {
	emojiListByCategory: EmojiByCategory[];
	customItemsLimit: number;
	handleLoadMore: () => void;
	handleSelectEmoji: (event: MouseEvent<HTMLElement>) => void;
	handleScroll: UIEventHandler<HTMLDivElement>;
};

const CategoriesResult = forwardRef<VirtuosoHandle, CategoriesResultProps>(function CategoriesResult(
	{ emojiListByCategory, customItemsLimit, handleLoadMore, handleSelectEmoji, handleScroll },
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
			<CustomScrollbars>
				<Virtuoso
					ref={ref}
					totalCount={emojiListByCategory.length}
					data={emojiListByCategory}
					onScroll={handleScroll}
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
					itemContent={(_, { key, ...data }) => (
						<EmojiCategoryRow
							categoryKey={key}
							customItemsLimit={customItemsLimit}
							handleLoadMore={handleLoadMore}
							handleSelectEmoji={handleSelectEmoji}
							{...data}
						/>
					)}
				/>
			</CustomScrollbars>
		</Box>
	);
});

export default memo(CategoriesResult);
