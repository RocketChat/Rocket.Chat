import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type EmojiPickerCategoryItemProps = {
	category: any;
	active: boolean;
	setSearching: (value: boolean) => void;
	handleGoToCategory: (categoryKey: string) => void;
};

const EmojiPickerCategoryItem = ({ category, active, handleGoToCategory }: EmojiPickerCategoryItemProps) => {
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
			className={['border-secondary-background-color', active && 'active', category.key, style].filter(Boolean)}
			title={t(category.i18n)}
		>
			<Box
				tabIndex={-1}
				onClick={() => handleGoToCategory(category.key)}
				is='a'
				href={`#${category.key}`}
				className='category-link'
				color='secondary-info'
			>
				<i
					style={{ fontSize: '20px', ...(active && { color: Palette.statusColor['status-font-on-info'].toString() }) }}
					className={`category-icon icon-${category.key}`}
				></i>
			</Box>
		</Box>
	);
};

export default EmojiPickerCategoryItem;
