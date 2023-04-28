import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { EmojiCategory } from '../../../../app/emoji/client';

type EmojiPickerCategoryItemProps = {
	category: EmojiCategory;
	index: number;
	active: boolean;
	handleGoToCategory: (categoryIndex: number) => void;
};

const EmojiPickerCategoryItem = ({ category, index, active, handleGoToCategory }: EmojiPickerCategoryItemProps) => {
	const t = useTranslation();

	const style = css`
		cursor: pointer;
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
			className={[active && 'active', category.key, style].filter(Boolean)}
			title={t(category.i18n)}
		>
			<Box tabIndex={-1} onClick={() => handleGoToCategory(index)} href={`#${category.key}`} color='secondary-info'>
				<i
					style={{ fontSize: '20px', ...(active && { color: Palette.statusColor['status-font-on-info'].toString() }) }}
					className={`category-icon icon-${category.key}`}
				></i>
			</Box>
		</Box>
	);
};

export default EmojiPickerCategoryItem;
