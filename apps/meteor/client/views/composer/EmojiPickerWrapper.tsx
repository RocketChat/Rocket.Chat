import { Box, Field, TextInput, Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { Fragment } from 'react';

type EmojiPickerWrapperProps = {
	activeCategory: string;
	searching: boolean;
	searchResults: string;
	currentTone: string;
	emojiList: (category: string) => string;
	emojiCategories: {
		key: 'recent' | 'rocket' | 'people' | 'nature' | 'food' | 'activity' | 'travel' | 'objects' | 'symbols' | 'flags';
		i18n: TranslationKey;
	}[];
};

const EmojiPickerWrapper = ({
	activeCategory,
	searching,
	searchResults,
	currentTone,
	emojiList,
	emojiCategories,
}: EmojiPickerWrapperProps) => {
	const t = useTranslation();
	const canManageEmoji = usePermission('manage-emoji');

	return (
		<>
			<Box display='flex' className='emoji-top'>
				<Field flexGrow={1} flexShrink={1}>
					<Field.Row>
						<TextInput
							className='js-emojipicker-search'
							addon={<Icon name='magnifier' size='x20' />}
							placeholder={t('Search')}
							aria-label={t('Search')}
							autoComplete='off'
						/>
					</Field.Row>
				</Field>
				<div className='change-tone'>
					<a href='#change-tone'>
						<span className={`current-tone ${currentTone}`}></span>
					</a>
					<ul className='tone-selector secondary-background-color'>
						<li>
							<a href='#tone' className='tone' data-tone='0'>
								<span className='tone-0'></span>
							</a>
						</li>
						<li>
							<a href='#tone' className='tone' data-tone='1'>
								<span className='tone-1'></span>
							</a>
						</li>
						<li>
							<a href='#tone' className='tone' data-tone='2'>
								<span className='tone-2'></span>
							</a>
						</li>
						<li>
							<a href='#tone' className='tone' data-tone='3'>
								<span className='tone-3'></span>
							</a>
						</li>
						<li>
							<a href='#tone' className='tone' data-tone='4'>
								<span className='tone-4'></span>
							</a>
						</li>
						<li>
							<a href='#tone' className='tone' data-tone='5'>
								<span className='tone-5'></span>
							</a>
						</li>
					</ul>
				</div>
			</Box>
			<Box color='default' className='filter'>
				<ul className='filter-list'>
					{emojiCategories.map((category) => (
						<li
							key={category.key}
							className={`filter-item border-secondary-background-color ${activeCategory} ${category.key}`}
							title={t(category.i18n)}
						>
							<Box is='a' href={`#${category.key}`} className='category-link' color='secondary-info'>
								<i className={`category-icon icon-${category.key}`}></i>
							</Box>
						</li>
					))}
				</ul>
			</Box>
			<Box color='default' className='emojis'>
				{searching ? (
					<Box dangerouslySetInnerHTML={{ __html: searchResults }} />
				) : (
					emojiCategories.map((category) => {
						return (
							<Fragment key={category.key}>
								<h4 className='emoji-list-category' id={`emoji-list-category-${category.key}`}>
									{t(category.i18n)}
								</h4>
								<ul className={`emoji-list emoji-category-${category.key}`}>
									<Box dangerouslySetInnerHTML={{ __html: emojiList(category.key) }} />
								</ul>
							</Fragment>
						);
					})
				)}
			</Box>
			<Box color='default' p='x4' className='emoji-footer'>
				{canManageEmoji && (
					<a className='add-custom' href='/admin/emoji-custom'>
						{t('Add_custom_emoji')}
					</a>
				)}
				<Box dangerouslySetInnerHTML={{ __html: t('Emoji_provided_by_JoyPixels') }} />
			</Box>
		</>
	);
};

export default EmojiPickerWrapper;
