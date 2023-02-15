import { Box } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { Fragment } from 'react';

const EmojiPickerWrapper = ({ activeCategory, searching, searchResults, currentTone, emojiList, emojiCategories, ...props }) => {
	// const wrapperRef = useRef() as MutableRefObject<HTMLDivElement>;
	const t = useTranslation();
	const canManageEmoji = usePermission('manage-emoji');
	console.log(props);

	return (
		// <div className='emoji-picker rc-popover__content'>
		<>
			<div className='emoji-top'>
				<div className='rc-input'>
					<label className='rc-input__label'>
						<div className='rc-input__wrapper'>
							<div className='rc-input__icon'>{/* {{> icon block='rc-input__icon-svg' icon='magnifier' }} */}</div>
							<input
								name='name'
								type='text'
								className='rc-input__element js-emojipicker-search'
								placeholder='Search'
								// autofocus
								// autocomplete='off'
							/>
						</div>
					</label>
				</div>
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
			</div>
			<div className='filter'>
				<ul className='filter-list'>
					{emojiCategories.map((category) => (
						<li
							key={category.key}
							className={`filter-item border-secondary-background-color ${activeCategory} ${category.key}`}
							title={t(category.i18n)}
						>
							<a href={`#${category.key}`} className='category-link color-info-font-color'>
								<i className={`category-icon icon-${category.key}`}></i>
							</a>
						</li>
					))}
				</ul>
			</div>
			<div className='emojis'>
				{searching ? (
					<Box dangerouslySetInnerHTML={{ __html: searchResults }} />
				) : (
					emojiCategories.map((category) => {
						console.log(category);
						return (
							<Fragment key={category.key}>
								<h4 className='emoji-list-category' id={`emoji-list-category-${category.key}`}>
									{t(category.i18n)}
								</h4>
								<ul className={`emoji-list emoji-category-${category.key}`}></ul>
							</Fragment>
						);
					})
				)}
			</div>
			<div className='emoji-footer'>
				{canManageEmoji && (
					<a className='add-custom' href='/admin/emoji-custom'>
						{t('Add_custom_emoji')}
					</a>
				)}
				{t('Emoji_provided_by_JoyPixels')}
			</div>
		</>
		// </div>
	);
};

export default EmojiPickerWrapper;
