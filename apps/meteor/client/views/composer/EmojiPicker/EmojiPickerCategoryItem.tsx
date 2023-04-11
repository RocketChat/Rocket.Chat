import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const EmojiPickerCategoryItem = ({ category, activeCategory, setSearching }) => {
	const t = useTranslation();

	const style = css`
		&:hover {
			border-block-end-color: ${Palette.stroke['stroke-light']};
		}
		&:focus {
			border: 1px solid ${Palette.stroke['stroke-dark']};
			border-radius: 0.5rem;
		}
	`;

	const handleSelect = (e) => {
		e.preventDefault();
		setSearching(false);
		const categoryHeader = document.getElementById(`emoji-list-category-${category.key}`);
		categoryHeader?.scrollIntoView({ behavior: 'smooth' });
	};

	return (
		<Box
			tabIndex={0}
			is='li'
			display='flex'
			justifyContent='center'
			flexGrow={1}
			pb='x4'
			borderBlockEndStyle='solid'
			borderBlockEndWidth={1}
			key={category.key}
			className={['filter-item', 'border-secondary-background-color', activeCategory, category.key, style].filter(Boolean)}
			title={t(category.i18n)}
		>
			<Box tabIndex={-1} onClick={handleSelect} is='a' href={`#${category.key}`} className='category-link' color='secondary-info'>
				<i style={{ fontSize: '20px' }} className={`category-icon icon-${category.key}`}></i>
			</Box>
		</Box>
	);
};

export default EmojiPickerCategoryItem;
