import { TextInput, Icon, Button, Divider } from '@rocket.chat/fuselage';
import { useMediaQuery, useOutsideClick } from '@rocket.chat/fuselage-hooks';
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
import React, { useLayoutEffect, useState, useEffect, useRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import type { EmojiItem, EmojiCategoryPosition } from '../../../../app/emoji/client';
import { emoji, getCategoriesList, getEmojisBySearchTerm } from '../../../../app/emoji/client';
import { usePreviewEmoji, useEmojiPickerData } from '../../../contexts/EmojiPickerContext';
import { useIsVisible } from '../../room/hooks/useIsVisible';
import CategoriesResult from './CategoriesResult';
import EmojiPickerCategoryItem from './EmojiPickerCategoryItem';
import EmojiPickerDropdown from './EmojiPickerDropDown';
import SearchingResult from './SearchingResult';
import ToneSelector from './ToneSelector';
import ToneSelectorWrapper from './ToneSelector/ToneSelectorWrapper';

type EmojiPickerProps = {
	reference: Element;
	onClose: () => void;
	onPickEmoji: (emoji: string) => void;
};

const EmojiPicker = ({ reference, onClose, onPickEmoji }: EmojiPickerProps) => {
	const t = useTranslation();

	const ref = useRef<Element | null>(reference);
	const categoriesPosition = useRef<EmojiCategoryPosition[]>([]);
	const textInputRef = useRef<HTMLInputElement>(null);
	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const emojiContainerRef = useRef<HTMLDivElement>(null);

	const isInputVisible = useIsVisible(textInputRef);

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
		getEmojiListsByCategory,
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
		if (recentEmojis.length === 0 && currentCategory === 'recent') {
			const customEmojiList = getEmojiListsByCategory().filter(({ key }) => key === 'rocket');
			handleGoToCategory(customEmojiList.length > 0 ? 0 : 1);
		}
	}, [actualTone, recentEmojis, getEmojiListsByCategory, currentCategory, setRecentEmojis]);

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

	// FIXME: not able to type the event scroll yet due the virtuoso version
	const handleScroll = (event: any) => {
		const scrollTop = event?.scrollTop;
		const last = categoriesPosition.current?.filter((pos) => pos.top <= scrollTop).pop();

		if (!last) {
			return;
		}

		const { el } = last;
		const category = el.id.replace('emoji-list-category-', '');

		setCurrentCategory(category);
	};

	const handleGoToCategory = (categoryIndex: number) => {
		setSearching(false);
		virtuosoRef.current?.scrollToIndex({ index: categoryIndex });
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
						autoFocus
						ref={textInputRef}
						value={searchTerm}
						onChange={handleSearch}
						addon={<Icon name='magnifier' size='x20' />}
						placeholder={t('Search')}
						aria-label={t('Search')}
					/>
				</EmojiPickerHeader>
				<EmojiPickerCategoryHeader role='tablist' {...(scrollCategories && { overflowX: 'scroll', h: 'x64' })}>
					{emojiCategories.map((category, index) => (
						<EmojiPickerCategoryItem
							key={category.key}
							index={index}
							category={category}
							active={category.key === currentCategory}
							handleGoToCategory={handleGoToCategory}
						/>
					))}
				</EmojiPickerCategoryHeader>
				<Divider mb={12} />
				<EmojiPickerListArea role='tabpanel'>
					{searching && <SearchingResult searchResults={searchResults} handleSelectEmoji={handleSelectEmoji} />}
					{!searching && (
						<CategoriesResult
							ref={virtuosoRef}
							emojiListByCategory={getEmojiListsByCategory()}
							categoriesPosition={categoriesPosition}
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
