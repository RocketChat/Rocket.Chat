import { Box, PositionAnimated, AnimatedVisibility, Field, TextInput, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, usePermission, useRoute } from '@rocket.chat/ui-contexts';
import type { ButtonElement } from '@rocket.chat/ui-kit';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import React, { useState, Fragment, useEffect, useRef, useLayoutEffect } from 'react';
import { FocusScope } from 'react-aria';

import { emoji } from '../../../../app/emoji/lib/rocketchat';
import type { EmojiElementType } from './EmojiElement';
import EmojiElement from './EmojiElement';
import EmojiPickerCategoryItem from './EmojiPickerCategoryItem';
import ToneSelector from './ToneSelector';
import { createEmojiList } from './helpers/createEmojiList';
import { getCategoriesList } from './helpers/getCategoriesList';
import { getEmojisBySearchTerm } from './helpers/getEmojisBySearchTerm';

const CUSTOM_CATEGORY = 'rocket';

const updateRecent = (recentList: string[]) => {
	const recentPkgList: string[] = emoji.packages.base.emojisByCategory.recent;
	recentList?.forEach((_emoji) => {
		!recentPkgList.includes(_emoji) && recentPkgList.push(_emoji);
	});
};

type EmojiByCategory = {
	key: string;
	i18n: TranslationKey;
	emojis: {
		list: EmojiElementType[];
		limit: number | null;
	};
};

type EmojiPickerProps = {
	composer?: any;
	onClose: () => void;
	reference: any;
	onPickEmoji: (emoji: string) => void;
};

const EmojiPicker = ({ composer, onClose, reference, onPickEmoji }: EmojiPickerProps) => {
	const t = useTranslation();

	const ref = useRef(reference);

	const textInputRef = useRef<HTMLInputElement>(null);
	const emojiContainerRef = useRef<HTMLDivElement>(null);

	const canManageEmoji = usePermission('manage-emoji');
	const customEmojiRoute = useRoute('emoji-custom');

	const [recentEmojis, setRecentEmojis] = useLocalStorage('emoji.recent', []);
	const [actualTone, setActualTone] = useLocalStorage('emoji.tone', 0);

	const [searching, setSearching] = useState(false);
	const [searchItemsLimit, setSearchItemsLimit] = useState(90);
	const [customItemsLimit, setCustomItemsLimit] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState([]);

	const [currentCategory, setCurrentCategory] = useState('recent');
	const [activeCategory, setActiveCategory] = useState();

	const emojiCategories = getCategoriesList();
	const [emojiListByCategory, setEmojiListByCategory] = useState<EmojiByCategory[]>([]);

	useOutsideClick([emojiContainerRef], onClose);

	const createPickerEmojis = (customItemsLimit, actualTone) => {
		const categories = getCategoriesList();

		const mappedCategories = categories.map((category) => ({
			key: category.key,
			i18n: category.i18n,
			emojis: {
				list: createEmojiList(category.key, actualTone),
				limit: category.key === CUSTOM_CATEGORY ? customItemsLimit : null,
			},
		}));

		return mappedCategories;
	};

	useEffect(() => {
		console.log('ENTREI NO EFEITO');

		if (emojiContainerRef.current) {
			emojiContainerRef.current.focus();
		}

		if (recentEmojis?.length > 0) {
			updateRecent(recentEmojis);
		}

		const emojis = createPickerEmojis(customItemsLimit, actualTone);
		setEmojiListByCategory(emojis);
	}, [actualTone, recentEmojis, customItemsLimit]);

	const updateEmojiListByCategory = (categoryKey: string, limit?: number) => {
		const result = emojiListByCategory.map((category) => {
			return categoryKey === category.key
				? {
						...category,
						emojis: {
							list: createEmojiList(category.key, null),
							limit: category.key === CUSTOM_CATEGORY ? limit | customItemsLimit : null,
						},
				  }
				: category;
		});

		setEmojiListByCategory(result);
	};

	const handleSelectEmoji = (event: MouseEvent<ButtonElement>) => {
		event.stopPropagation();

		const _emoji = event.currentTarget.dataset?.emoji;

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

		// EmojiPicker.pickEmoji(_emoji + tone);
		onPickEmoji(_emoji + tone);
		addRecentEmoji(_emoji);
		onClose();
	};

	const addRecentEmoji = (_emoji) => {
		const recent = recentEmojis || [];
		// const newRecent = recent ? recent.split(',') : [];
		const pos = recent.indexOf(_emoji);

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

		const emojisResult = getEmojisBySearchTerm(e.target.value, actualTone);
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

	return (
		<PositionAnimated tabIndex={0} is='dialog' visible={AnimatedVisibility.UNHIDING} anchor={ref} placement='top-start'>
			<div>
				{/* <FocusScope contain autoFocus> */}
				<Box
					width='x365'
					ref={emojiContainerRef}
					height='x300'
					bg='light'
					padding='x8'
					borderRadius={4}
					elevation='2'
					display='flex'
					flexDirection='column'
				>
					<Box display='flex' className='emoji-top'>
						<Field flexGrow={1} flexShrink={1}>
							<Field.Row>
								<TextInput
									autoFocus
									ref={textInputRef}
									value={searchTerm}
									onKeyDown={handleKeyDown}
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
									activeCategory={activeCategory}
									setSearching={setSearching}
								/>
							))}
						</Box>
					</Box>
					<Box role='three' color='default' className='emojis' overflowY='scroll' height='100%'>
						{searching && searchResults.length > 0 && (
							<Box is='ul' mb='x4' display='flex' flexWrap='wrap'>
								{searchResults?.map(
									({ emoji, image }, index = 1) =>
										index < searchItemsLimit && <EmojiElement key={emoji} emoji={emoji} image={image} onClick={handleSelectEmoji} />,
								)}
							</Box>
						)}
						{searching && searchResults?.length > searchItemsLimit && (
							<Box mbe='x8'>
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
										<Box is='h4' className='emoji-list-category' id={`emoji-list-category-${key}`}>
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
											<Box mbe='x8'>
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
					<Box color='default' p='x4' className='emoji-footer'>
						{canManageEmoji && (
							<a className='add-custom' onClick={() => customEmojiRoute.push()}>
								{t('Add_custom_emoji')}
							</a>
						)}
						<Box dangerouslySetInnerHTML={{ __html: t('Emoji_provided_by_JoyPixels') }} />
					</Box>
				</Box>
				{/* </FocusScope> */}
			</div>
		</PositionAnimated>
	);
};

export default EmojiPicker;
