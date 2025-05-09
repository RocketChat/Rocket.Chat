import { TextInput, Icon, Button, Divider } from '@rocket.chat/fuselage';
import { useMediaQuery, useMergedRefs, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import {
	EmojiPickerCategoryHeader,
	EmojiPickerContainer,
	EmojiPickerFooter,
	EmojiPickerPreviewArea,
	EmojiPickerHeader,
	EmojiPickerListArea,
	EmojiPickerPreview,
} from '@rocket.chat/ui-client';
import { useTranslation, usePermission, useRoute } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { useLayoutEffect, useState, useEffect, useRef } from 'react';
import type { ListRange, VirtuosoHandle } from 'react-virtuoso';

import CategoriesResult from './CategoriesResult';
import EmojiPickerCategoryItem from './EmojiPickerCategoryItem';
import EmojiPickerDropdown from './EmojiPickerDropDown';
import SearchingResult from './SearchingResult';
import ToneSelector from './ToneSelector';
import ToneSelectorWrapper from './ToneSelector/ToneSelectorWrapper';
import { emoji, getCategoriesList, getEmojisBySearchTerm } from '../../../../app/emoji/client';
import type { EmojiItem } from '../../../../app/emoji/client';
import { usePreviewEmoji, useEmojiPickerData } from '../../../contexts/EmojiPickerContext';
import { useIsVisible } from '../../room/hooks/useIsVisible';

type EmojiPickerProps = {
	reference: Element;
	onClose: () => void;
	onPickEmoji: (emoji: string) => void;
};

const EmojiPicker = ({ reference, onClose, onPickEmoji }: EmojiPickerProps) => {
	const t = useTranslation();

	const ref = useRef<Element | null>(reference);
	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const emojiContainerRef = useRef<HTMLDivElement>(null);

	const [isVisibleRef, isInputVisible] = useIsVisible();
	const textInputRef = useRef<HTMLInputElement>();

	const mergedTextInputRef = useMergedRefs(isVisibleRef, textInputRef);

	const emojiCategories = getCategoriesList();

	const canManageEmoji = usePermission('manage-emoji');
	const customEmojiRoute = useRoute('emoji-custom');

	const [searching, setSearching] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<EmojiItem[]>([]);

	const { emojiToPreview, handleRemovePreview } = usePreviewEmoji();
	const {
		recentEmojis,
		setCurrentCategory,
		addRecentEmoji,
		setRecentEmojis,
		actualTone,
		currentCategory,
		categoriesIndexes,
		emojiListByCategory,
		customItemsLimit,
		setActualTone,
		setCustomItemsLimit,
	} = useEmojiPickerData();

	useEffect(() => () => handleRemovePreview(), [handleRemovePreview]);

	const scrollCategories = useMediaQuery('(width < 340px)');

	useOutsideClick([emojiContainerRef], onClose);

	useLayoutEffect(() => {
		if (!reference) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			const anchorRect = reference.getBoundingClientRect();
			if (anchorRect.width === 0 && anchorRect.height === 0) {
				// The element is hidden, skip it
				ref.current = null;
				return;
			}

			ref.current = reference;
		});

		resizeObserver.observe(reference);

		return () => {
			resizeObserver.disconnect();
		};
	}, [reference]);

	useEffect(() => {
		if (textInputRef.current && isInputVisible) {
			textInputRef.current.focus();
		}
	}, [isInputVisible]);

	const handleSelectEmoji = (event: MouseEvent<HTMLElement>) => {
		event.stopPropagation();

		const _emoji = event.currentTarget.dataset?.emoji;

		if (!_emoji) {
			return;
		}

		let tone = '';

		for (const emojiPackage in emoji.packages) {
			if (emoji.packages.hasOwnProperty(emojiPackage)) {
				if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(_emoji)) {
					tone = `_tone${actualTone}`;
				}
			}
		}

		setSearchTerm('');

		onPickEmoji(_emoji + tone);
		addRecentEmoji(_emoji + tone);
		onClose();
	};

	useEffect(() => {
		setCurrentCategory('recent');
	}, [setCurrentCategory]);

	const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentCategory('');
		setSearching(e.target.value !== '');

		const emojisResult = getEmojisBySearchTerm(e.target.value, actualTone, recentEmojis, setRecentEmojis);

		if (emojisResult.filter((emoji) => emoji.image).length === 0) {
			setCurrentCategory('no-results');
		}
		setSearchResults(emojisResult as EmojiItem[]);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	const handleLoadMore = () => {
		setCustomItemsLimit(customItemsLimit + 90);
	};

	const handleScroll = (range: ListRange) => {
		const { startIndex } = range;

		const category = categoriesIndexes.find(
			(category, index) => category.index <= startIndex + 1 && categoriesIndexes[index + 1]?.index >= startIndex,
		);

		if (!category) {
			return;
		}

		setCurrentCategory(category.key);
	};

	const handleGoToCategory = (category: string) => {
		setSearching(false);
		const { index } = categoriesIndexes.find((item) => item.key === category) || {};

		if (index === undefined) {
			return;
		}

		virtuosoRef.current?.scrollToIndex({ index: index > 0 ? index + 1 : 0 });
	};

	const handleGoToAddCustom = () => {
		customEmojiRoute.push();
		onClose();
	};

	return (
		<EmojiPickerDropdown reference={ref as RefObject<HTMLElement>} ref={emojiContainerRef}>
			<EmojiPickerContainer role='dialog' aria-label={t('Emoji_picker')} onKeyDown={handleKeyDown}>
				<EmojiPickerHeader>
					<TextInput
						// FIXME: remove autoFocus prop when rewriting the emojiPicker dropdown
						autoFocus
						ref={mergedTextInputRef}
						value={searchTerm}
						onChange={handleSearch}
						addon={<Icon name='magnifier' size='x20' />}
						placeholder={t('Search')}
						aria-label={t('Search')}
					/>
				</EmojiPickerHeader>
				<EmojiPickerCategoryHeader role='tablist' {...(scrollCategories && { style: { overflowX: 'scroll' } })}>
					{emojiCategories.map((category) => (
						<EmojiPickerCategoryItem
							key={category.key}
							category={category}
							active={category.key === currentCategory}
							handleGoToCategory={() => handleGoToCategory(category.key)}
						/>
					))}
				</EmojiPickerCategoryHeader>
				<Divider mb={12} />
				<EmojiPickerListArea role='tabpanel'>
					{searching && <SearchingResult searchResults={searchResults} handleSelectEmoji={handleSelectEmoji} />}
					{!searching && (
						<CategoriesResult
							ref={virtuosoRef}
							items={emojiListByCategory}
							customItemsLimit={customItemsLimit}
							handleLoadMore={handleLoadMore}
							handleSelectEmoji={handleSelectEmoji}
							handleScroll={handleScroll}
						/>
					)}
				</EmojiPickerListArea>
				<EmojiPickerPreviewArea>
					<div>
						{emojiToPreview && <EmojiPickerPreview emoji={emojiToPreview.emoji} name={emojiToPreview.name} />}
						{canManageEmoji && emojiToPreview === null && (
							<Button small onClick={handleGoToAddCustom}>
								{t('Add_emoji')}
							</Button>
						)}
					</div>
					<ToneSelectorWrapper caption={t('Skin_tone')}>
						<ToneSelector tone={actualTone} setTone={setActualTone} />
					</ToneSelectorWrapper>
				</EmojiPickerPreviewArea>
				<EmojiPickerFooter>{t('Powered_by_JoyPixels')}</EmojiPickerFooter>
			</EmojiPickerContainer>
		</EmojiPickerDropdown>
	);
};

export default EmojiPicker;
