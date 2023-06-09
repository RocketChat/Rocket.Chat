import { TextInput, Icon, Button, Divider } from '@rocket.chat/fuselage';
import { useLocalStorage, useMediaQuery, useOutsideClick } from '@rocket.chat/fuselage-hooks';
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
import React, { useLayoutEffect, useState, useEffect, useRef, useCallback } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import type { EmojiItem, EmojiByCategory, EmojiCategoryPosition } from '../../../../app/emoji/client';
import {
	emoji,
	updateRecent,
	getCategoriesList,
	createEmojiList,
	getEmojisBySearchTerm,
	createPickerEmojis,
	CUSTOM_CATEGORY,
} from '../../../../app/emoji/client';
import { usePreviewEmoji } from '../../../contexts/EmojiPickerContext';
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

const DEFAULT_ITEMS_LIMIT = 90;

const EmojiPicker = ({ reference, onClose, onPickEmoji }: EmojiPickerProps) => {
	const t = useTranslation();

	const ref = useRef<Element | null>(reference);
	const categoriesPosition = useRef<EmojiCategoryPosition[]>([]);
	const textInputRef = useRef<HTMLInputElement>(null);
	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const emojiContainerRef = useRef<HTMLDivElement>(null);

	const isInputVisible = useIsVisible(textInputRef);

	const emojiCategories = getCategoriesList();
	const [emojiListByCategory, setEmojiListByCategory] = useState<EmojiByCategory[]>([]);

	const canManageEmoji = usePermission('manage-emoji');
	const customEmojiRoute = useRoute('emoji-custom');

	const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('emoji.recent', []);
	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);

	const [searching, setSearching] = useState(false);
	const [customItemsLimit, setCustomItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<EmojiItem[]>([]);
	const [currentCategory, setCurrentCategory] = useState('recent');

	const { emojiToPreview, handleRemovePreview } = usePreviewEmoji();

	useEffect(() => () => handleRemovePreview(), []);

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

	const showInitialCategory = useCallback((customEmojiList) => {
		handleGoToCategory(customEmojiList.length > 0 ? 0 : 1);
	}, []);

	useEffect(() => {
		if (textInputRef.current && isInputVisible) {
			textInputRef.current.focus();
		}
	}, [isInputVisible]);

	useEffect(() => {
		if (recentEmojis?.length > 0) {
			updateRecent(recentEmojis);
		}

		const emojis = createPickerEmojis(customItemsLimit, actualTone, recentEmojis, setRecentEmojis);
		setEmojiListByCategory(emojis);

		if (recentEmojis.length === 0 && currentCategory === 'recent') {
			const customEmojiList = emojis.filter(({ key }) => key === 'rocket');
			showInitialCategory(customEmojiList);
		}
	}, [actualTone, recentEmojis, customItemsLimit, currentCategory, setRecentEmojis, showInitialCategory]);

	// TODO: improve this update
	const updateEmojiListByCategory = (categoryKey: string, limit: number = DEFAULT_ITEMS_LIMIT) => {
		const result = emojiListByCategory.map((category) => {
			return categoryKey === category.key
				? {
						...category,
						emojis: {
							list: createEmojiList(category.key, null, recentEmojis, setRecentEmojis),
							limit: category.key === CUSTOM_CATEGORY ? limit | customItemsLimit : null,
						},
				  }
				: category;
		});

		setEmojiListByCategory(result);
	};

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

	const addRecentEmoji = (_emoji: string) => {
		const recent = recentEmojis || [];
		const pos = recent.indexOf(_emoji as never);

		if (pos !== -1) {
			recent.splice(pos, 1);
		}

		recent.unshift(_emoji);

		// limit recent emojis to 27 (3 rows of 9)
		recent.splice(27);

		setRecentEmojis(recent);
		emoji.packages.base.emojisByCategory.recent = recent;
		updateEmojiListByCategory('recent');
	};

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
		setCustomItemsLimit((prevState) => prevState + 90);
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
				<Divider mb='x12' />
				<EmojiPickerListArea role='tabpanel'>
					{searching && <SearchingResult searchResults={searchResults} handleSelectEmoji={handleSelectEmoji} />}
					{!searching && (
						<CategoriesResult
							ref={virtuosoRef}
							emojiListByCategory={emojiListByCategory}
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
