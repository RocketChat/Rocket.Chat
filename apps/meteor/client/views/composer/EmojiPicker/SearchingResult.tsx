import { EmojiPickerNotFound } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import React, { useRef } from 'react';
import type { VirtuosoGridHandle } from 'react-virtuoso';
import { VirtuosoGrid } from 'react-virtuoso';

import type { EmojiItem } from '../../../../app/emoji/client';
import { VirtuosoScrollbars } from '../../../components/CustomScrollbars';
import EmojiElement from './EmojiElement';
import SearchingResultWrapper from './SearchingResultWrapper';

/**
 * the `SearchingResults` is missing the previous loadMore function that was implemented before on the latest version of EmojiPicker using the Blaze Template. It can't be implemented because of the issue with react-virtuoso and the custom scrollbars, since its using virtual list its not gonna be an issue rendering bigger results for search
 *
 */

type SearchingResultProps = {
	searchResults: EmojiItem[];
	handleSelectEmoji: (event: MouseEvent<HTMLElement>) => void;
};

const SearchingResult = ({ searchResults, handleSelectEmoji }: SearchingResultProps) => {
	const t = useTranslation();
	const ref = useRef<VirtuosoGridHandle>(null);

	if (searchResults.length === 0) {
		return <EmojiPickerNotFound>{t('No_emojis_found')}</EmojiPickerNotFound>;
	}

	return (
		<VirtuosoGrid
			ref={ref}
			totalCount={searchResults.length}
			components={{
				Scroller: VirtuosoScrollbars,
				List: SearchingResultWrapper,
			}}
			itemContent={(index) => {
				const { emoji, image } = searchResults[index] || {};
				return <EmojiElement emoji={emoji} image={image} onClick={handleSelectEmoji} />;
			}}
		/>
	);
};

export default SearchingResult;
