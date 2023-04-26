import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import React, { useRef } from 'react';
import type { VirtuosoGridHandle } from 'react-virtuoso';
import { VirtuosoGrid } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import EmojiElement from './EmojiElement';
import type { EmojiElementType } from './EmojiElementType';
import SearchingResultWrapper from './SearchingResultWrapper';

// TODO: handleLoadMore for searching

type SearchingResultProps = {
	searchResults: EmojiElementType[];
	_searchItemsLimit: number;
	_handleLoadMore: () => void;
	handleSelectEmoji: (event: MouseEvent<HTMLElement>) => void;
};

const SearchingResult = ({ searchResults, _searchItemsLimit, _handleLoadMore, handleSelectEmoji }: SearchingResultProps) => {
	const t = useTranslation();
	const ref = useRef<VirtuosoGridHandle>(null);

	if (searchResults.length === 0) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' fontScale='c1' mb='x8'>
				{t('No_emojis_found')}
			</Box>
		);
	}

	return (
		<VirtuosoGrid
			ref={ref}
			totalCount={searchResults.length}
			components={{
				Scroller: ScrollableContentWrapper,
				List: SearchingResultWrapper,
			}}
			itemContent={(index) => {
				const { emoji, image } = searchResults[index] || {};
				return <EmojiElement emoji={emoji} image={image} onClick={handleSelectEmoji} />;
				// return index < searchItemsLimit && <EmojiElement emoji={emoji} image={image} onClick={handleSelectEmoji} />;
			}}
		/>
	);
};

// {
// 	searching && searchResults.length > 0 && (
// 		<Box is='ul' mb='x4' display='flex' flexWrap='wrap'>
// 			{searchResults?.map(
// 				({ emoji, image }, index = 1) =>
// 					index < searchItemsLimit && <EmojiElement key={emoji} emoji={emoji} image={image} onClick={handleSelectEmoji} />,
// 			)}
// 		</Box>
// 	);
// }
// {searching && searchResults?.length > searchItemsLimit && (
//   <Box display='flex' flexDirection='column' alignItems='center' mbe='x8'>
//     <Box is='a' fontScale='c1' onClick={handleLoadMore}>
//       {t('Load_more')}
//     </Box>
//   </Box>
// )}
// {searching && searchResults.length === 0 && (
//   <Box fontScale='c1' mb='x8'>
//     {t('No_emojis_found')}
//   </Box>
// )}

export default SearchingResult;
