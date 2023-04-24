import { Box, PositionAnimated, AnimatedVisibility, Field, TextInput, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, usePermission, useRoute } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import React, { useState, Fragment, useEffect, useRef, useLayoutEffect, useCallback } from 'react';

import type { EmojiItem } from '../../../../app/emoji/client';
import {
	emoji,
	updateRecent,
	getCategoriesList,
	createEmojiList,
	getEmojisBySearchTerm,
	createPickerEmojis,
	CUSTOM_CATEGORY,
} from '../../../../app/emoji/client';
import EmojiElement from './EmojiElement';
import type { EmojiElementType } from './EmojiElementType';
import EmojiPickerCategoryItem from './EmojiPickerCategoryItem';
import ToneSelector from './ToneSelector';

type EmojiByCategory = {
	key: string;
	i18n: TranslationKey;
	emojis: {
		list: EmojiElementType[];
		limit: number | null;
	};
};

type EmojiPickerProps = {
	reference?: Element;
	onClose: () => void;
	onPickEmoji: (emoji: string) => void;
};

type CategoriesPosition = {
	el: Element;
	top: number;
};

const DEFAULT_ITEMS_LIMIT = 90;

const EmojiPicker = ({ reference, onClose, onPickEmoji }: EmojiPickerProps) => {
	const t = useTranslation();

	const ref = useRef(reference);
	const catPositions = useRef<CategoriesPosition[]>([]);
	const textInputRef = useRef<HTMLInputElement>(null);
	const emojiContainerRef = useRef<HTMLDivElement>(null);

	const emojiCategories = getCategoriesList();
	const [emojiListByCategory, setEmojiListByCategory] = useState<EmojiByCategory[]>([]);

	const canManageEmoji = usePermission('manage-emoji');
	const customEmojiRoute = useRoute('emoji-custom');

	const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('emoji.recent', []);
	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);

	const [searching, setSearching] = useState(false);
	const [searchItemsLimit, setSearchItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);
	const [customItemsLimit, setCustomItemsLimit] = useState(DEFAULT_ITEMS_LIMIT);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<EmojiItem[]>([]);
	const [currentCategory, setCurrentCategory] = useState('recent');

	useOutsideClick([emojiContainerRef], onClose);

	useLayoutEffect(() => {
		if (!reference) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			const anchorRect = reference.getBoundingClientRect();
			if (anchorRect.width === 0 && anchorRect.height === 0) {
				// The element is hidden, skip it
				ref.current = undefined;
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
		console.log(customEmojiList);
		handleGoToCategory(customEmojiList.length > 0 ? 'rocket' : 'people');
	}, []);

	useEffect(() => {
		if (emojiContainerRef.current) {
			emojiContainerRef.current.focus();
		}

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
		setSearchItemsLimit(90);

		onPickEmoji(_emoji + tone);
		addRecentEmoji(_emoji + tone);
		onClose();
	};

	const addRecentEmoji = (_emoji: string) => {
		const recent = recentEmojis || [];
		// const newRecent = recent ? recent.split(',') : [];
		const pos = recent.indexOf(_emoji as never);

		if (pos !== -1) {
			recent.splice(pos, 1);
		}

		recent.unshift(_emoji);

		// limit recent emojis to 27 (3 rows of 9)
		recent.splice(27);

		// updatePositions = true;
		setRecentEmojis(recent);

		// Meteor._localStorage.setItem('emoji.recent', this.recent);
		emoji.packages.base.emojisByCategory.recent = recent;

		updateEmojiListByCategory('recent');
	};

	const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
		setCurrentCategory('');
		setSearching(e.target.value !== '');

		const emojisResult = getEmojisBySearchTerm(e.target.value, actualTone, recentEmojis, setRecentEmojis);
		setSearchResults(emojisResult);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	const handleLoadMore = () => {
		if (searching) {
			return setSearchItemsLimit((prevState) => prevState + 90);
		}

		setCustomItemsLimit((prevState) => prevState + 90);
		// updateEmojiListByCategory('rocket', (customItemsLimit += 90));
	};

	const handleScroll = (e: SyntheticEvent) => {
		const container = e.currentTarget;
		const scrollTop = container?.scrollTop + container.clientHeight;

		const last = catPositions.current?.filter((pos) => pos.top <= scrollTop).pop();

		if (!last) {
			return;
		}

		const { el } = last;
		const category = el.id.replace('emoji-list-category-', '');

		setCurrentCategory(category);
	};

	const handleGoToCategory = (categoryKey: string) => {
		setSearching(false);
		const categoryHeader = document.getElementById(`emoji-list-category-${categoryKey}`);
		categoryHeader?.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<PositionAnimated tabIndex={0} is='dialog' visible={AnimatedVisibility.UNHIDING} anchor={ref} placement='top-start'>
			<div>
				<Box
					color='default'
					width='x365'
					ref={emojiContainerRef}
					height='x300'
					bg='light'
					padding='x8'
					borderRadius={4}
					elevation='2'
					display='flex'
					flexDirection='column'
					onKeyDown={handleKeyDown}
				>
					<Box display='flex' alignItems='center'>
						<Field flexGrow={1} flexShrink={1}>
							<Field.Row>
								<TextInput
									autoFocus
									ref={textInputRef}
									value={searchTerm}
									onChange={handleSearch}
									// className='js-emojipicker-search'
									addon={<Icon name='magnifier' size='x20' />}
									placeholder={t('Search')}
									aria-label={t('Search')}
								/>
							</Field.Row>
						</Field>
						<ToneSelector tone={actualTone} setTone={setActualTone} />
					</Box>
					<Box color='default' className='filter' mbe='x8'>
						<Box is='ul' display='flex'>
							{emojiCategories.map((category) => (
								<EmojiPickerCategoryItem
									key={category.key}
									category={category}
									active={category.key === currentCategory}
									setSearching={setSearching}
									handleGoToCategory={handleGoToCategory}
								/>
							))}
						</Box>
					</Box>
					<Box onScroll={handleScroll} role='three' color='default' className='emojis' overflowY='scroll' height='100%'>
						{searching && searchResults.length > 0 && (
							<Box is='ul' mb='x4' display='flex' flexWrap='wrap'>
								{searchResults?.map(
									({ emoji, image }, index = 1) =>
										index < searchItemsLimit && <EmojiElement key={emoji} emoji={emoji} image={image} onClick={handleSelectEmoji} />,
								)}
							</Box>
						)}
						{searching && searchResults?.length > searchItemsLimit && (
							<Box display='flex' flexDirection='column' alignItems='center' mbe='x8'>
								<Box is='a' fontScale='c1' onClick={handleLoadMore}>
									{t('Load_more')}
								</Box>
							</Box>
						)}
						{searching && searchResults.length === 0 && (
							<Box fontScale='c1' mb='x8'>
								{t('No_emojis_found')}
							</Box>
						)}

						{!searching &&
							emojiListByCategory?.map(({ key, i18n, emojis }) => {
								return (
									<Fragment key={key}>
										<Box
											is='h4'
											ref={(element) => {
												catPositions.current.push({ el: element, top: element?.offsetTop });
												return element;
											}}
											className='emoji-list-category'
											id={`emoji-list-category-${key}`}
										>
											{t(i18n)}
										</Box>
										{emojis.list.length > 0 && (
											<Box is='ul' mb='x8' display='flex' flexWrap='wrap' className={`emoji-list emoji-category-${key}`}>
												<>
													{key === CUSTOM_CATEGORY &&
														emojis.list.map(
															({ emoji, image }, index = 1) =>
																index < customItemsLimit && (
																	<EmojiElement key={emoji + key} emoji={emoji} image={image} onClick={handleSelectEmoji} />
																),
														)}
													{!(key === CUSTOM_CATEGORY) &&
														emojis.list.map(({ emoji, image }) => (
															<EmojiElement key={emoji + key} emoji={emoji} image={image} onClick={handleSelectEmoji} />
														))}
												</>
											</Box>
										)}
										{emojis.limit && emojis.limit > 0 && emojis.list.length > emojis.limit && (
											<Box display='flex' flexDirection='column' alignItems='center' mbe='x8'>
												<Box is='a' fontScale='c1' onClick={handleLoadMore}>
													{t('Load_more')}
												</Box>
											</Box>
										)}
										{emojis.list.length === 0 && (
											<Box fontScale='c1' mb='x8'>
												{t('No_emojis_found')}
											</Box>
										)}
									</Fragment>
								);
							})}
					</Box>
					<Box display='flex' flexDirection='column' alignItems='center' fontScale='c1' p='x4'>
						{canManageEmoji && (
							<a className='add-custom' onClick={() => customEmojiRoute.push()}>
								{t('Add_custom_emoji')}
							</a>
						)}
						<Box dangerouslySetInnerHTML={{ __html: t('Emoji_provided_by_JoyPixels') }} />
					</Box>
				</Box>
			</div>
		</PositionAnimated>
	);
};

export default EmojiPicker;
